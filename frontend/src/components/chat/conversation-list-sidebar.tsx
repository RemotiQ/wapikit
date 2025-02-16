import { ScrollArea } from '~/components/ui/scroll-area'
import Image from 'next/image'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useConversationInboxStore } from '~/store/conversation-inbox.store'
import { Icons } from '../icons'
import { generateUniqueId } from '~/reusable-functions'
import { type ConversationSchema, ConversationStatusEnum } from 'root/.generated'
import { listStringEnumMembers } from 'ts-enum-utils'
import { useRouter } from 'next/navigation'
import LastMessagePreview from './last-message-preview'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Fragment } from 'react'

enum ConversationListSidebarTab {
	All = 'All',
	Unread = 'Unread',
	Unresolved = 'Unresolved'
}

const RenderConversations = ({
	conversations,
	tab
}: {
	conversations: ConversationSchema[]
	tab: ConversationListSidebarTab
}) => {
	const router = useRouter()
	return (
		<Fragment key={tab}>
			{conversations.length === 0 && (
				<div className="flex h-full flex-col items-center justify-center">
					<Icons.messageChatSquare className="size-6 font-normal text-muted-foreground" />
					<p className="text-gray-500">
						No {tab !== ConversationListSidebarTab.All && tab} conversations yet
					</p>
				</div>
			)}

			{conversations.map((conversation, index) => {
				return (
					<Fragment key={conversation.uniqueId}>
						<div
							key={index}
							className="my-auto mb-2 flex cursor-pointer flex-row items-center gap-4 rounded-md px-3 py-2 hover:bg-gray-100 hover:dark:bg-gray-800"
							onClick={() => {
								router.push(`/conversations?id=${conversation.uniqueId}`)
							}}
						>
							<Image
								src={'/assets/empty-pfp.png'}
								height={50}
								width={50}
								className="object-fit aspect-square h-8 w-8 rounded-full"
								alt={`${conversation.contact.uniqueId}-avatar`}
							/>
							<div className="flex w-full flex-row justify-between">
								<div className="flex flex-col">
									<div className="flex items-center gap-2">
										<p className="text-sm"> {conversation.contact.name}</p>
									</div>
									<LastMessagePreview conversation={conversation} />
								</div>
								<div className="flex items-center justify-center">
									{conversation.numberOfUnreadMessages > 0 && (
										<div className="flex size-7 items-center justify-center rounded-full bg-primaryShades-50 !p-2 text-xs font-bold text-primaryShades-700">
											{conversation.numberOfUnreadMessages}
										</div>
									)}
								</div>
							</div>
						</div>
						<Separator className="mx-1" />
					</Fragment>
				)
			})}
		</Fragment>
	)
}

const ConversationsSidebar = () => {
	const { conversations } = useConversationInboxStore()

	return (
		<ScrollArea
			className="flex  h-full max-w-sm flex-col gap-2 px-4 py-4"
			key={`${generateUniqueId()}`}
		>
			<Tabs defaultValue="All" className="w-full space-y-6">
				<TabsList className="flex w-full flex-row " defaultValue={'All'}>
					{listStringEnumMembers(ConversationListSidebarTab).map(
						({ value: tab }, index) => {
							return (
								<TabsTrigger
									value={tab}
									className="flex flex-1 items-center gap-1"
									key={index}
								>
									{/* {
										{
											All: <Icons.messageChatSquare className="size-4" />,
											Unread: <Icons.bell className="size-4" />,
											Unresolved: (
												<Icons.messageQuestionSquare className="size-4" />
											)
										}[tab]
									}
									<p className='hidden xl:flex'>{tab}</p> */}
									<TooltipProvider delayDuration={200}>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className="flex items-center gap-1">
													{
														{
															All: (
																<Icons.messageChatSquare className="size-4" />
															),
															Unread: (
																<Icons.bell className="size-4" />
															),
															Unresolved: (
																<Icons.messageQuestionSquare className="size-4" />
															)
														}[tab]
													}
													<p className="hidden 2xl:flex">{tab}</p>
												</span>
											</TooltipTrigger>
											<TooltipContent className="xl:hidden">
												{tab}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</TabsTrigger>
							)
						}
					)}
				</TabsList>
				<TabsContent value={ConversationListSidebarTab.All} className="space-y-4">
					{/* render the conversation as it is */}
					<RenderConversations
						conversations={conversations}
						tab={ConversationListSidebarTab.All}
						key={`${ConversationListSidebarTab.All}`}
					/>
				</TabsContent>
				<TabsContent value={ConversationListSidebarTab.Unread} className="space-y-4">
					{/* render the unread conversation */}
					<RenderConversations
						conversations={conversations.filter(c => c.numberOfUnreadMessages > 0)}
						tab={ConversationListSidebarTab.Unread}
						key={`${ConversationListSidebarTab.Unread}`}
					/>
				</TabsContent>
				<TabsContent value={ConversationListSidebarTab.Unresolved} className="space-y-4">
					{/* render the unresolved conversations */}
					<RenderConversations
						conversations={conversations.filter(
							c => c.status === ConversationStatusEnum.Active
						)}
						tab={ConversationListSidebarTab.Unresolved}
						key={`${ConversationListSidebarTab.Unresolved}`}
					/>
				</TabsContent>
			</Tabs>
		</ScrollArea>
	)
}

export default ConversationsSidebar
