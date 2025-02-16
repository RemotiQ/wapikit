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
import { infoNotification, successNotification } from '~/reusable-functions'
import { getBackendUrl } from '~/constants'
import React, { useEffect, useState } from 'react'
import { useAuthState } from '~/hooks/use-auth-state'
import { Skeleton } from '../ui/skeleton'

type MediaCacheEntry = {
	blobUrl: string
	refCount: number
}

const mediaCache = new Map<string, MediaCacheEntry>()

const fetchMedia = async (
	mediaId: string,
	conversationId: string,
	authToken: string
): Promise<string> => {
	const cacheKey = `${conversationId}-${mediaId}`
	const existingEntry = mediaCache.get(cacheKey)

	if (existingEntry) {
		existingEntry.refCount += 1
		mediaCache.set(cacheKey, existingEntry)
		return existingEntry.blobUrl
	}

	const response = await fetch(
		`${getBackendUrl()}/conversation/${conversationId}/media/${mediaId}`,
		{
			headers: {
				'x-access-token': authToken
			},
			credentials: 'include',
			mode: 'cors',
			cache: 'no-cache'
		}
	)

	if (!response.ok) throw new Error('Failed to fetch media')

	const blob = await response.blob()
	const blobUrl = URL.createObjectURL(blob)
	mediaCache.set(cacheKey, { blobUrl, refCount: 1 })
	return blobUrl
}

const releaseMedia = (mediaId: string, conversationId: string) => {
	const cacheKey = `${conversationId}-${mediaId}`
	const entry = mediaCache.get(cacheKey)

	if (entry) {
		entry.refCount -= 1
		if (entry.refCount <= 0) {
			URL.revokeObjectURL(entry.blobUrl)
			mediaCache.delete(cacheKey)
		} else {
			mediaCache.set(cacheKey, entry)
		}
	}
}

function downloadDocument(params: { url: string; fileName?: string }) {
	const { url, fileName } = params
	const a = document.createElement('a')
	a.href = url
	a.download = fileName || 'Document'
	document.body.appendChild(a)
	a.click()
	a.remove()
}

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
		if (!authState.isAuthenticated) return

		let isMounted = true

		const loadMedia = async () => {
			try {
				const url = await fetchMedia(mediaId, conversationId, authState.data.token)
				if (isMounted) setBlobUrl(url)
			} catch (error) {
				console.error('Failed to load media', error)
			}
		}

		loadMedia().catch(error => {
			console.error(error)
		})

		return () => {
			isMounted = false
			releaseMedia(mediaId, conversationId)
		}
	}, [authState, conversationId, mediaId, mediaType])

	if (!blobUrl) {
		return (
			<Skeleton
				className={
					mediaType === MessageTypeEnum.Video
						? 'aspect-video size-72'
						: mediaType === MessageTypeEnum.Image
							? 'aspect-square size-72'
							: mediaType === MessageTypeEnum.Audio
								? 'aspect-video h-20 w-72'
								: ''
				}
			/>
		)
	}

	if (mediaType === MessageTypeEnum.Image) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={blobUrl}
				className="h-auto max-w-72 rounded-md object-contain"
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

const DocumentMessageComponent: React.FC<{ message: DocumentMessage }> = ({ message }) => {
	const { authState } = useAuthState()
	const { fileName, id: mediaId } = message.messageData
	const conversationId = message.conversationId

	const handleMediaAction = async (action: 'view' | 'download') => {
		if (!authState.isAuthenticated) return

		try {
			infoNotification({
				message: action === 'view' ? 'Viewing document' : 'Downloading document'
			})

			const url = await fetchMedia(mediaId, conversationId, authState.data.token)

			if (action === 'view') {
				window.open(url, '_blank')
			} else {
				downloadDocument({ url, fileName })
			}

			// Schedule cleanup after 1 minute
			setTimeout(() => {
				releaseMedia(mediaId, conversationId)
			}, 60000)
		} catch (error) {
			console.error(`Error ${action}ing document:`, error)
		}
	}

	return (
		<div
			className="group relative flex cursor-pointer flex-row items-center gap-3 rounded-md p-3"
			onClick={() => handleMediaAction('view')}
		>
			<div className="flex flex-row gap-2 py-3">
				<Icons.file className="h-8 w-8 text-primary" />
				<div className="flex flex-col truncate">
					<p className="w-48 truncate text-sm font-medium text-muted-foreground">
						{fileName || 'Document'}
					</p>
				</div>
			</div>

			<span
				onClick={e => {
					e.stopPropagation()
					handleMediaAction('download')
				}}
				className="cursor-pointer rounded-full border border-muted-foreground text-xs text-muted-foreground group-hover:underline"
			>
				<Icons.arrowDown className="size-5 font-bold" />
			</span>
		</div>
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
	const { authState } = useAuthState()

	const messageActions: {
		label: string
		icon: keyof typeof Icons
		onClick?: () => void
	}[] = [
		{
			label: 'Delete',
			icon: 'trash',
			onClick: () => {}
		},
		{
			label: 'Reply',
			icon: 'reply',
			onClick: () => {}
		},
		{
			label: 'Copy',
			icon: 'copy',
			onClick: () => {
				const content =
					message.messageType === MessageTypeEnum.Text
						? ((message.messageData.text || '') as string)
						: message.messageType === MessageTypeEnum.Document
							? ((message.messageData.link || '') as string)
							: ''

				copyToClipboard(content)
				successNotification({ message: 'Copied' })
			}
		},
		...(message.messageType !== MessageTypeEnum.Text &&
		message.messageType !== MessageTypeEnum.Location &&
		message.messageType !== MessageTypeEnum.Reaction
			? [
					{
						label: 'Download',
						icon: 'download' as const,
						onClick: async () => {
							try {
								if (!authState.isAuthenticated) return

								let filename = ''

								if (message.messageType === MessageTypeEnum.Document) {
									filename =
										message.messageData.fileName ||
										`${message.messageData.id}.pdf`
								}

								if (message.messageType === MessageTypeEnum.Image) {
									filename = `${message.messageData.id}.png`
								}

								if (message.messageType === MessageTypeEnum.Video) {
									filename = `${message.messageData.id}.mp4`
								}

								if (message.messageType === MessageTypeEnum.Audio) {
									filename = `${message.messageData.id}.mp3`
								}

								const url = await fetchMedia(
									message.messageData.id,
									message.conversationId,
									authState.data.token
								)

								downloadDocument({ url, fileName: filename })
							} catch (error) {
								console.error('Download failed:', error)
							}
						}
					}
				]
			: [])
	]

	return (
		<div
			className={clsx(
				'group relative w-fit max-w-[45%] gap-1 overflow-hidden rounded-md md:max-w-[55%] 2xl:max-w-[75%]',
				message.messageType === MessageTypeEnum.Text
					? 'pb-2 pl-[9px] pr-[7px] pt-[6px]'
					: message.messageType === MessageTypeEnum.Location
						? 'p-[5px]'
						: 'p-[3px]',
				message.direction === MessageDirectionEnum.InBound
					? 'mr-auto bg-white dark:bg-[#202c33]'
					: 'ml-auto bg-[#d9fdd3] text-secondary-foreground dark:bg-[#005c4b]'
			)}
			onMouseEnter={() => {
				if (message.messageType === MessageTypeEnum.Video) setShowControls(true)
			}}
			onMouseLeave={() => {
				if (message.messageType === MessageTypeEnum.Video) setShowControls(false)
			}}
		>
			{isActionsEnabled && (
				<div className="absolute right-2 top-0 z-50 h-fit">
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger
							asChild
							className="invisible inline-block group-hover:visible"
						>
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
								const Icon = Icons[action.icon] as any
								return (
									<DropdownMenuItem
										key={index}
										onClick={action.onClick}
										className="flex items-center gap-2"
									>
										<Icon className="size-4" />
										{action.label}
									</DropdownMenuItem>
								)
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
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
						<DocumentMessageComponent message={message} />
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
				{message.createdAt && (
					<span className="text-[11px] font-semibold">
						{dayjs(message.createdAt).format('hh:mm A')}
					</span>
				)}
				{message.direction === MessageDirectionEnum.OutBound && (
					<div>
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
				)}
			</div>
		</div>
	)
}

export default MessageRenderer
