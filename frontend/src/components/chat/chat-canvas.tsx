'use client'

import { ScrollArea } from '~/components/ui/scroll-area'
import { CardHeader, CardFooter } from '../ui/card'
import { Separator } from '../ui/separator'
import { Input } from '../ui/input'
import { Button } from '~/components/ui/button'
import { motion } from 'framer-motion'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Icons } from '../icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
	type ConversationSchema,
	type MessageSchema,
	MessageTypeEnum,
	type NewMessageDataSchema,
	useAssignConversation,
	useGetConversationResponseSuggestions,
	useGetOrganizationMembers,
	useMarkConversationAsRead,
	useSendMessageInConversation,
	useUnassignConversation
} from 'root/.generated'
import MessageRenderer from './message-renderer'
import { useRouter } from 'next/navigation'
import {
	determineMessageType,
	errorNotification,
	getDayLabel,
	groupMessagesByDate,
	successNotification
} from '~/reusable-functions'
import { Modal } from '../ui/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AssignConversationForm } from '~/schema'
import { type z } from 'zod'
import { isPresent } from 'ts-is-present'
import { useLayoutStore } from '~/store/layout.store'
import ContactDetailsSheet from '../contact-details-sheet'
import { useConversationInboxStore } from '~/store/conversation-inbox.store'
import Image from 'next/image'
import { useScrollToBottom } from '~/hooks/use-scroll-to-bottom'
import { SparklesIcon } from '../ai/icons'
import { clsx } from 'clsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { useUploadMedia } from '~/hooks/use-upload-media'
import dayjs from 'dayjs'
import { PreviewAttachment } from './file-attachment-preview'
import { type ConversationFileAttachmentType } from '~/types'

const ChatCanvas = ({ conversationId }: { conversationId?: string }) => {
	const [isBusy, setIsBusy] = useState(false)
	const [isConversationAssignModalOpen, setIsConversationAssignModalOpen] = useState(false)
	const { conversations } = useConversationInboxStore()

	const fileInputRef = useRef<HTMLInputElement>(null)
	const textInputRef = useRef<HTMLInputElement>(null)

	const [attachedFiles, setAttachedFiles] = useState<ConversationFileAttachmentType[]>([])

	const currentConversation = conversations.find(
		conversation => conversation.uniqueId === conversationId
	)

	const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>()

	const router = useRouter()
	const { writeProperty } = useLayoutStore()
	const { writeProperty: writeConversationInboxStoreProperty } = useConversationInboxStore()

	const assignConversationMutation = useAssignConversation()
	const unassignConversationMutation = useUnassignConversation()
	const sendMessageInConversation = useSendMessageInConversation()
	const { mutateAsync: markAsRead, isPending } = useMarkConversationAsRead()

	const assignConversationForm = useForm<z.infer<typeof AssignConversationForm>>({
		resolver: zodResolver(AssignConversationForm)
	})

	const { data: organizationMembersResponse } = useGetOrganizationMembers({
		page: 1,
		per_page: 50,
		sortBy: 'asc'
	})

	async function assignConversation(data: z.infer<typeof AssignConversationForm>) {
		try {
			if (isBusy || !currentConversation) return

			setIsBusy(true)
			const assignConversationResponse = await assignConversationMutation.mutateAsync({
				data: {
					organizationMemberId: data.assignee
				},
				id: currentConversation.uniqueId
			})

			if (assignConversationResponse.data) {
				successNotification({
					message: 'Conversation assigned successfully'
				})
				setIsConversationAssignModalOpen(false)
			} else {
				errorNotification({
					message: 'Failed to assign conversation'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Failed to assign conversation'
			})
		} finally {
			setIsBusy(false)
		}
	}

	async function unassignConversation() {
		try {
			if (isBusy || !currentConversation) return

			setIsBusy(true)
			const unassignConversationResponse = await unassignConversationMutation.mutateAsync({
				data: {
					userId: ''
				},
				id: currentConversation.uniqueId
			})

			if (unassignConversationResponse.data) {
				successNotification({
					message: 'Conversation unassigned successfully'
				})
			} else {
				errorNotification({
					message: 'Failed to unassign conversation'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Failed to unassign conversation'
			})
		} finally {
			setIsBusy(false)
		}
	}

	const chatActions: {
		label: string
		icon: keyof typeof Icons
		onClick?: () => void
	}[] = [
		{
			label: 'Edit Contact',
			icon: 'edit',
			onClick: () => {
				router.push(`/contacts/new-or-edit/${currentConversation?.uniqueId}`)
			}
		},
		{
			label: 'Unassign',
			icon: 'removeUser',
			onClick() {
				unassignConversation().catch(error => console.error(error))
			}
		},
		{
			label: 'Block',
			icon: 'xCircle'
		},
		{
			label: 'Mark As Resolved',
			icon: 'check'
		},
		{
			label: 'Info',
			icon: 'infoCircle',
			onClick: () => {
				writeProperty({
					contactSheetContactId: currentConversation?.contact.uniqueId
				})
			}
		}
	]

	const [messageContent, setMessageContent] = useState<string | null>(null)

	useEffect(() => {
		if (!isPending && currentConversation && currentConversation.numberOfUnreadMessages > 0) {
			markAsRead({
				id: currentConversation.uniqueId
			})
				.then(data => {
					if (data.isRead) {
						writeConversationInboxStoreProperty({
							conversations: conversations.map(convo =>
								convo.uniqueId === currentConversation.uniqueId
									? {
											...convo,
											numberOfUnreadMessages: 0
										}
									: convo
							)
						})
					}
				})
				.catch(error => console.error(error))
		}
	}, [
		conversations,
		currentConversation,
		isPending,
		markAsRead,
		writeConversationInboxStoreProperty
	])

	const {
		data: suggestions,
		refetch: refetchSuggestions,
		isFetching: isFetchingSuggestions,
		isRefetching: isRefetchingSuggestions
	} = useGetConversationResponseSuggestions(
		{
			conversationId: currentConversation?.uniqueId || ''
		},
		{
			query: {
				enabled: !!currentConversation
			}
		}
	)

	const { error, uploadMedia } = useUploadMedia(conversationId)

	const pushMessageToConversation = useCallback(
		(message: MessageSchema) => {
			const conversation = conversations.find(
				convo => convo.uniqueId === message.conversationId
			)

			if (!conversation) {
				return false
			}

			const updatedConversation: ConversationSchema = {
				...conversation,
				messages: [...conversation.messages, message]
			}

			writeConversationInboxStoreProperty({
				conversations: conversations.map(convo =>
					convo.uniqueId === conversation.uniqueId ? updatedConversation : convo
				)
			})
		},
		[conversations, writeConversationInboxStoreProperty]
	)

	const sendMessage = useCallback(
		async (message: string) => {
			try {
				console.log('sendMessage', {
					currentConversation,
					message
				})

				if (!currentConversation || (!message && !attachedFiles.length)) return
				setIsBusy(true)

				// * user can select multiple files at a time, but will be sent as separate messages only
				if (attachedFiles.length) {
					const mediaFilesArray = Array.from(attachedFiles)

					for (const file of mediaFilesArray) {
						setAttachedFiles(files =>
							files.map(f => {
								if (f.fileName === file.fileName) {
									return {
										...f,
										isUploading: true
									}
								}
								return f
							})
						)
						const response = await uploadMedia(file.file)

						if (error || !response) {
							errorNotification({
								message: error || 'Failed to upload media'
							})
							return
						}

						const { mediaId, mediaUrl } = response

						console.log('mediaUrl', mediaUrl)

						// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
						let messageData: NewMessageDataSchema | null = null

						switch (file.mediaType) {
							case MessageTypeEnum.Audio:
								messageData = {
									messageType: MessageTypeEnum.Audio,
									id: mediaId,
									link: mediaUrl
								}
								break

							case MessageTypeEnum.Image:
								messageData = {
									messageType: MessageTypeEnum.Image,
									id: mediaId,
									link: mediaUrl,
									caption: textInputRef.current?.value
								}
								break

							case MessageTypeEnum.Document:
								messageData = {
									messageType: MessageTypeEnum.Document,
									id: mediaId,
									link: mediaUrl,
									fileName: file.fileName,
									caption: textInputRef.current?.value
								}
								break

							case MessageTypeEnum.Video:
								messageData = {
									messageType: MessageTypeEnum.Video,
									id: mediaId,
									link: mediaUrl
								}
								break

							case MessageTypeEnum.Sticker:
								messageData = {
									messageType: MessageTypeEnum.Sticker,
									id: mediaId,
									link: mediaUrl
								}
								break

							default:
								break
						}

						if (!messageData) {
							errorNotification({
								message: 'Failed to send message'
							})
							return
						}

						const sendMessageResponse = await sendMessageInConversation.mutateAsync({
							data: {
								createdAt: dayjs().toISOString(),
								messageData: messageData
							},
							id: currentConversation.uniqueId
						})

						if (sendMessageResponse.message) {
							pushMessageToConversation(sendMessageResponse.message)
							setMessageContent(() => null)
							setAttachedFiles(files =>
								files.filter(f => f.fileName !== file.fileName)
							)
						} else {
							errorNotification({
								message: 'Failed to send message'
							})
						}
					}

					setAttachedFiles(() => [])
					return
				} else {
					// TEXT MESSAGE
					const sendMessageResponse = await sendMessageInConversation.mutateAsync({
						data: {
							messageData: {
								messageType: 'Text',
								text: message
							},
							createdAt: dayjs().toISOString()
						},
						id: currentConversation.uniqueId
					})

					pushMessageToConversation(sendMessageResponse.message)
					setMessageContent(() => null)
				}
			} catch (error) {
				console.error(error)
				errorNotification({
					message: 'Failed to send message'
				})
			} finally {
				setIsBusy(false)
			}
		},
		[
			currentConversation,
			attachedFiles,
			uploadMedia,
			error,
			sendMessageInConversation,
			pushMessageToConversation
		]
	)

	const groupedMessages = groupMessagesByDate(currentConversation?.messages || [])

	return (
		<div className="relative flex h-full flex-col justify-between">
			<ContactDetailsSheet />

			<Modal
				title="Assign Conversation to"
				description="Select a team member to assign this conversation to."
				isOpen={isConversationAssignModalOpen}
				onClose={() => {
					setIsConversationAssignModalOpen(false)
				}}
			>
				<div className="flex w-full items-center justify-end space-x-2 pt-6">
					<Form {...assignConversationForm}>
						<form
							onSubmit={assignConversationForm.handleSubmit(assignConversation)}
							className="w-full space-y-8"
						>
							<div className="flex flex-col gap-8">
								<FormField
									control={assignConversationForm.control}
									name="assignee"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex flex-row items-center gap-2">
												Select Assignee
											</FormLabel>
											<FormControl>
												<Select
													disabled={isBusy}
													onValueChange={e => {
														field.onChange(e)
													}}
													name="assignee"
												>
													<SelectTrigger>
														<div>
															{organizationMembersResponse?.members
																?.map(member => {
																	if (
																		member.uniqueId ===
																		assignConversationForm.getValues(
																			'assignee'
																		)
																	) {
																		const stringToReturn = `${member.name} - ${member.email}`
																		return stringToReturn
																	} else {
																		return null
																	}
																})
																.filter(isPresent)[0] ||
																'Select Assignee'}
														</div>
													</SelectTrigger>
													<SelectContent
														side="bottom"
														className="max-h-64"
													>
														{!organizationMembersResponse ||
														organizationMembersResponse?.members
															.length === 0 ? (
															<SelectItem
																value={'no message template'}
																disabled
															>
																No organization member.
															</SelectItem>
														) : (
															<>
																{organizationMembersResponse?.members.map(
																	member => (
																		<SelectItem
																			key={`${member.uniqueId}`}
																			value={member.uniqueId}
																		>
																			{member.name} -{' '}
																			{member.email}
																		</SelectItem>
																	)
																)}
															</>
														)}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<Button disabled={isBusy} className="ml-auto mr-0 w-full" type="submit">
								Assign Conversation
							</Button>
						</form>
					</Form>
				</div>
			</Modal>

			{currentConversation ? (
				<>
					<CardHeader className="item-center flex !flex-row justify-between rounded-t-md  bg-[#f0f2f5] p-3 py-2 ">
						<div className="flex flex-row items-center gap-3">
							<Image
								src={'/assets/empty-pfp.png'}
								height={50}
								width={50}
								className="object-fit aspect-square h-10 w-10 cursor-pointer rounded-full"
								alt={`${currentConversation.uniqueId} avatar`}
								onClick={() => {
									writeProperty({
										contactSheetContactId: currentConversation?.contact.uniqueId
									})
								}}
							/>
							<p className="font-semi-bold align-middle text-base text-secondary-foreground">
								{currentConversation.contact.name}
							</p>
						</div>

						<div className="ml-auto flex flex-row items-center gap-4">
							<div className="flex flex-row items-center gap-2 text-sm text-secondary-foreground">
								Assigned To:
								{currentConversation.assignedTo ? (
									// ! TODO: show tippy on hover with user details
									<span>{currentConversation.assignedTo.name}</span>
								) : (
									<span
										className="rounded-full bg-white p-1"
										onClick={() => {
											setIsConversationAssignModalOpen(() => true)
										}}
									>
										<Icons.plus className="size-4 text-secondary-foreground" />
									</span>
								)}
							</div>
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									<Icons.dotsVertical className="text-bold h-5 w-5 cursor-pointer text-secondary-foreground" />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{chatActions.map((action, index) => {
										const Icon = Icons[action.icon]
										return (
											<DropdownMenuItem
												key={index}
												onClick={() => {
													if (action.onClick) {
														action.onClick()
													}
												}}
												className="flex flex-row items-center gap-2"
											>
												<Icon className="size-4" />
												{action.label}
											</DropdownMenuItem>
										)
									})}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardHeader>
					<Separator />

					{/* ! TODO: this should always open at the end of scroll container */}
					<ScrollArea
						className={clsx(
							'relative h-screen bg-[#ebe5de] px-2 dark:bg-[#111b21]',
							suggestions?.suggestions.length ? '!pb-64' : '!pb-44'
						)}
					>
						<div className='absolute inset-0 z-20 h-full w-full  bg-[url("/assets/chat-canvas-bg.png")] bg-repeat opacity-20' />
						<div
							className="relative flex h-full flex-col  gap-2"
							ref={messagesContainerRef}
						>
							{groupedMessages.map((group, groupIndex) => (
								<div
									key={groupIndex}
									className="relative z-30 flex w-full flex-col gap-1"
								>
									{/* Date Header */}
									<div className="my-2 flex w-full justify-center">
										<span className="rounded bg-gray-200 px-2 py-0.5 text-sm text-gray-700 dark:bg-[#2a3942] dark:text-gray-300">
											{getDayLabel(group.date)}
										</span>
									</div>

									{/* All messages for this date */}
									{group.messages.map((message, index) => (
										<MessageRenderer
											key={message.uniqueId || index}
											message={message}
											isActionsEnabled={true}
										/>
									))}
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>
					</ScrollArea>

					<div className="sticky bottom-0 z-30 ">
						<div className="pointer-events-none inset-x-px  bottom-0 h-12 bg-gradient-to-t from-[#ebe5de] opacity-50 transition-opacity"></div>
						{suggestions?.suggestions?.length ? (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ duration: 0.5 }}
								className="relative z-30 w-full overflow-hidden"
							>
								<div className="flex flex-1 flex-row justify-start gap-4 overflow-scroll px-5 pb-4">
									{suggestions?.suggestions.map((response, index) => {
										if (index > 3) return null
										return (
											<TooltipProvider key={index} delayDuration={200}>
												<Tooltip>
													<TooltipTrigger>
														<p
															key={index}
															className="h-auto w-fit cursor-pointer justify-start whitespace-normal rounded-md bg-[#f0f2f5] p-1 px-4 py-2 text-left text-sm font-medium text-secondary-foreground"
															onClick={() => {
																setMessageContent(() => response)
																sendMessage(response).catch(error =>
																	console.error(error)
																)
															}}
														>
															{response.length > 40
																? `${response.slice(0, 40)}...`
																: response}
														</p>
													</TooltipTrigger>
													<TooltipContent
														className="max-w-xs"
														sideOffset={0}
													>
														{response}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)
									})}
								</div>
							</motion.div>
						) : null}
						<CardFooter className="flex w-full flex-col items-center gap-2 bg-white dark:bg-[#202c33]">
							<Separator />
							<div className="mt-2 flex w-full items-center justify-start gap-2 overflow-visible px-2">
								{attachedFiles.length > 0 && (
									<div className="flex flex-row items-end gap-2 overflow-x-scroll">
										{attachedFiles.map(file => (
											<PreviewAttachment
												key={file.fileName}
												attachment={file}
												removeFile={() => {
													setAttachedFiles(files =>
														files.filter(
															f => f.fileName !== file.fileName
														)
													)
												}}
											/>
										))}
									</div>
								)}
							</div>
							<form
								className="flex h-full w-full items-center gap-2"
								onSubmit={e => {
									e.preventDefault()
									sendMessage(messageContent || '').catch(error =>
										console.error(error)
									)
								}}
							>
								<div
									className=""
									onClick={() => {
										fileInputRef.current?.click()
									}}
								>
									<Icons.plus className="size-6" />
								</div>

								{/* file input */}
								<input
									type="file"
									ref={fileInputRef}
									multiple={true}
									className="hidden"
									onChange={e => {
										const files = e.target.files
											? Array.from(e.target.files)
											: []
										if (files.length === 0) return
										setAttachedFiles(data => [
											...data,
											...files.map(file => ({
												file,
												isUploading: false,
												fileName: file.name,
												mediaType: determineMessageType(file)
											}))
										])
									}}
								/>

								{/* text input */}
								<Input
									placeholder="Type Message here"
									className="w-full"
									ref={textInputRef}
									type="text"
									// defaultValue={messageContent || undefined}
									value={messageContent || ''}
									onChange={e => {
										setMessageContent(() => e.target.value)
									}}
								/>

								{isFetchingSuggestions || isRefetchingSuggestions ? (
									<div className="rotate my-auto h-5 w-5 animate-spin rounded-full border-4 border-solid  border-l-primary" />
								) : (
									<div
										className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-background ring-1 ring-border"
										onClick={() => {
											refetchSuggestions().catch(error =>
												console.error(error)
											)
										}}
									>
										<div className="my-auto translate-y-px">
											<SparklesIcon size={12} />
										</div>
									</div>
								)}

								<Button type="submit" className="rounded-lg" disabled={isBusy}>
									<Icons.send className="size-4" />
								</Button>
							</form>
						</CardFooter>
					</div>
				</>
			) : (
				<div className="flex h-full flex-col items-center justify-center bg-[#ebe5de] dark:bg-[#111b21]">
					<Icons.pointer className="size-4" />
					<p className="text-lg font-semibold">No Conversation Selected</p>
					<p className="text-sm">Select a conversation from the side list</p>
				</div>
			)}
		</div>
	)
}

export default ChatCanvas
