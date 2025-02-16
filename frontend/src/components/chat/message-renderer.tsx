import { clsx } from 'clsx'
import dayjs from 'dayjs'
import {
	type DocumentMessage,
	type LocationMessage,
	MessageDirectionEnum,
	MessageTypeEnum,
	type TextMessage,
	type MessageSchema,
	MessageStatusEnum
} from 'root/.generated'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem
} from '../ui/dropdown-menu'
import { Icons } from '../icons'
import { useCopyToClipboard } from 'usehooks-ts'
import { successNotification } from '~/reusable-functions'
import { getBackendUrl } from '~/constants'
import React, { useEffect, useState } from 'react'
import { useAuthState } from '~/hooks/use-auth-state'
import { Skeleton } from '../ui/skeleton'

const TextMessage = (message: TextMessage) => {
	return <p className="text-wrap text-sm">{message.messageData.text}</p>
}

function LoadMedia({
	conversationId,
	mediaId,
	mediaType,
	showControls
}: {
	mediaType: MessageTypeEnum
	mediaId: string
	conversationId: string
	showControls?: boolean
}) {
	const [blobUrl, setBlobUrl] = useState<string | null>(null)
	const { authState } = useAuthState()

	useEffect(() => {
		if (!authState.isAuthenticated) {
			return
		}
		let url: string | null = null
		// Our authenticated fetch to the backend:
		fetch(`${getBackendUrl()}/conversation/${conversationId}/media/${mediaId}`, {
			headers: {
				'x-access-token': `${authState.data.token}`
			},
			credentials: 'include',
			mode: 'cors',
			cache: 'no-cache'
		})
			.then(res => res.blob())
			.then(blob => {
				url = URL.createObjectURL(blob)
				setBlobUrl(url)
			})
			.catch(err => {
				console.error('Failed to load image', err)
			})

		return () => {
			// Cleanup
			if (url) {
				URL.revokeObjectURL(url)
			}
		}
	}, [authState, conversationId, mediaId, mediaType])

	if (!blobUrl) {
		return (
			<Skeleton
				className={
					mediaType === MessageTypeEnum.Video
						? 'aspect-video'
						: mediaType === MessageTypeEnum.Image
							? 'aspect-square size-72'
							: ''
				}
			/>
		)
	}

	if (mediaType === MessageTypeEnum.Image) {
		return (
			<img
				src={blobUrl}
				className="h-auto max-w-72  rounded-md object-contain"
				alt="image message"
			/>
		)
	} else if (mediaType === MessageTypeEnum.Video) {
		return (
			<video
				className="h-auto max-w-60 rounded-md object-contain"
				src={blobUrl}
				disablePictureInPicture
				disableRemotePlayback
				controlsList="nodownload noplaybackrate"
				controls={showControls}
			/>
		)
	} else if (mediaType === MessageTypeEnum.Audio) {
		return <audio src={blobUrl} controls />
	} else {
		return (
			<div>
				<Icons.infoCircle className="size-4" />
				Unsupported media type
			</div>
		)
	}
}

const DocumentMessage = (message: DocumentMessage) => {
	return (
		<a href={message.messageData.link} download>
			{message.messageData.link}
		</a>
	)
}

const LocationMessage = (message: LocationMessage) => {
	return (
		<p>
			Location: {message.messageData.latitude}, {message.messageData.longitude}
		</p>
	)
}

const MessageRenderer: React.FC<{ message: MessageSchema; isActionsEnabled: boolean }> = ({
	message,
	isActionsEnabled
}) => {
	const copyToClipboard = useCopyToClipboard()[1]
	const [showControls, setShowControls] = useState(false)

	const messageActions: {
		label: string
		icon: keyof typeof Icons
		onClick?: () => void
	}[] = [
		{
			label: 'Delete',
			icon: 'trash',
			// ! TODO: implement delete message
			onClick: () => {}
		},
		{
			label: 'Reply',
			icon: 'reply',
			// ! TODO: implement reply message
			onClick: () => {}
		},
		{
			label: 'Copy',
			icon: 'copy',
			onClick: () => {
				if (message.messageType === MessageTypeEnum.Text) {
					copyToClipboard((message.messageData.text || '') as string).catch(error =>
						console.error(error)
					)
				} else if (message.messageType === MessageTypeEnum.Document) {
					copyToClipboard((message.messageData.link || '') as string).catch(error =>
						console.error(error)
					)
				} else {
					// do nothing
				}
				successNotification({
					message: 'Copied'
				})
			}
		}
		// {
		// 	label: 'React',
		// 	icon: 'clipboard',
		// 	onClick: () => {
		// 		copyToClipboard((message.messageData || '') as string).catch(error =>
		// 			console.error(error)
		// 		)
		// 		successNotification({
		// 			message: 'Copied'
		// 		})
		// 	}
		// }
	]

	return (
		<div
			className={clsx(
				'group relative w-fit gap-1 overflow-hidden rounded-md max-w-[45%] md:max-w-[55%] 2xl:max-w-[75%]',
				message.messageType === MessageTypeEnum.Text
					? 'pb-2 pl-[9px] pr-[7px] pt-[6px]'
					: message.messageType === MessageTypeEnum.Location
						? 'p-[5px]'
						: 'p-[3px]',
				message.direction === MessageDirectionEnum.InBound
					? 'mr-auto bg-white dark:bg-[#202c33]'
					: 'ml-auto bg-[#d9fdd3]  text-secondary-foreground dark:bg-[#005c4b]'
			)}
			onMouseEnter={() => {
				if (message.messageType === MessageTypeEnum.Video) {
					setShowControls(true)
				}
			}}
			onMouseLeave={() => {
				if (message.messageType === MessageTypeEnum.Video) {
					setShowControls(false)
				}
			}}
		>
			{isActionsEnabled ? (
				<div className="absolute top-0 right-2 z-50 h-fit">
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild className='invisible group-hover:visible inline-block'>
							<Icons.chevronDown
								className={clsx(
									'h-[22px] w-[22px] font-bold',
									message.messageType === MessageTypeEnum.Image ||
										message.messageType === MessageTypeEnum.Video
										? 'text-white'
										: message.direction === MessageDirectionEnum.InBound
											? ''
											: 'text-secondary-foreground'
								)}
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" side="right">
							{messageActions.map((action, index) => {
								const Icon = Icons[action.icon]
								return (
									<DropdownMenuItem
										key={index}
										onClick={() => {
											if (action.onClick) {
												action.onClick()
											}
										}}
										className="flex  flex-row items-center gap-2"
									>
										<Icon className="size-4" />
										{action.label}
									</DropdownMenuItem>
								)
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			) : null}
			<div className="relative w-fit overflow-hidden">
				<div className="flex w-full items-center justify-between">
					{message.messageType === MessageTypeEnum.Text ? (
						TextMessage(message)
					) : message.messageType === MessageTypeEnum.Video ? (
						<LoadMedia
							conversationId={message.conversationId}
							mediaId={message.messageData.id}
							mediaType={message.messageType}
							showControls={showControls}
						/>
					) : message.messageType === MessageTypeEnum.Document ? (
						DocumentMessage(message)
					) : message.messageType === MessageTypeEnum.Image ? (
						<LoadMedia
							conversationId={message.conversationId}
							mediaId={message.messageData.id}
							mediaType={message.messageType}
						/>
					) : message.messageType === MessageTypeEnum.Audio ? (
						<LoadMedia
							conversationId={message.conversationId}
							mediaId={message.messageData.id}
							mediaType={message.messageType}
						/>
					) : message.messageType === MessageTypeEnum.Location ? (
						LocationMessage(message)
					) : null}
					{message.messageType === MessageTypeEnum.Text ? (
						<span className="min-h-0">
							<span className="invisible inline-flex h-0 px-2 py-0">
								{' '}
								{message.createdAt ? (
									<span className={clsx(' text-[11px] font-semibold')}>
										{dayjs(message.createdAt).format('hh:mm A')}
									</span>
								) : null}
								{message.direction === MessageDirectionEnum.OutBound ? (
									<div className="">
										{message.status === MessageStatusEnum.Delivered ? (
											<Icons.doubleCheck className="h-4 w-4 text-muted-foreground" />
										) : message.status === MessageStatusEnum.Sent ? (
											<Icons.check className="h-4 w-4 text-muted-foreground" />
										) : message.status === MessageStatusEnum.Read ? (
											<Icons.doubleCheck className="h-4 w-4 text-green-500" />
										) : null}
									</div>
								) : null}
							</span>
						</span>
					) : null}
				</div>
				{message.messageType === MessageTypeEnum.Image ||
				message.messageType === MessageTypeEnum.Video ? (
					<div
						className={`absolute bottom-0 left-0 z-[2] h-7 w-full rounded-md bg-gradient-to-t from-[rgba(11,20,26,0.5)] to-[rgba(11,20,26,0)]`}
					></div>
				) : null}
			</div>
			<div
				className={clsx(
					'flex flex-row items-center gap-[1px] whitespace-nowrap',
					message.messageType === MessageTypeEnum.Image ||
						message.messageType === MessageTypeEnum.Video
						? 'absolute bottom-2 right-[9px] p-[2] text-white'
						: 'relative z-10 float-right mb-[-5px] ml-2 mt-[-10px] text-muted-foreground'
				)}
			>
				{message.createdAt ? (
					<span className={clsx(' text-[11px] font-semibold')}>
						{dayjs(message.createdAt).format('hh:mm A')}
					</span>
				) : null}

				{message.direction === MessageDirectionEnum.OutBound ? (
					<div className="">
						{message.status === MessageStatusEnum.Delivered ? (
							<Icons.doubleCheck
								className={clsx(
									'h-4 w-4',
									message.messageType === MessageTypeEnum.Image ||
										message.messageType === MessageTypeEnum.Video
										? 'text-white'
										: 'text-muted-foreground'
								)}
							/>
						) : message.status === MessageStatusEnum.Sent ? (
							<Icons.check
								className={clsx(
									'h-4 w-4',
									message.messageType === MessageTypeEnum.Image ||
										message.messageType === MessageTypeEnum.Video
										? 'text-white'
										: 'text-muted-foreground'
								)}
							/>
						) : message.status === MessageStatusEnum.Read ? (
							<Icons.doubleCheck className="h-4 w-4 text-green-500" />
						) : null}
					</div>
				) : null}
			</div>
		</div>
	)
}

export default MessageRenderer
