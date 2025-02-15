import { clsx } from 'clsx'
import dayjs from 'dayjs'
import {
	type AudioMessage,
	type DocumentMessage,
	type ImageMessage,
	type LocationMessage,
	MessageDirectionEnum,
	MessageTypeEnum,
	type TextMessage,
	type VideoMessage,
	type MessageSchema
} from 'root/.generated'
import { ChevronDown } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem
} from '../ui/dropdown-menu'
import { Icons } from '../icons'
import { useCopyToClipboard } from 'usehooks-ts'
import { successNotification } from '~/reusable-functions'

const TextMessage = (message: TextMessage) => {
	return <p className="text-wrap text-sm">{message.messageData.text}</p>
}

const VideoMessage = (message: VideoMessage) => {
	return <video src={message.messageData.link} controls />
}

const ImageMessage = (message: ImageMessage) => {
	return <img src={message.messageData.link} alt="image" />
}

const DocumentMessage = (message: DocumentMessage) => {
	return (
		<a href={message.messageData.link} download>
			{message.messageData.link}
		</a>
	)
}

const AudioMessage = (message: AudioMessage) => {
	return <audio src={message.messageData.link} controls />
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
			icon: 'clipboard',
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
				'flex  w-fit max-w-md gap-1  rounded-md p-1 px-3',
				message.direction === MessageDirectionEnum.InBound
					? 'mr-auto bg-white dark:bg-[#202c33]'
					: 'ml-auto bg-[#d9fdd3]  text-secondary-foreground dark:bg-[#005c4b]'
			)}
		>
			{message.messageType === MessageTypeEnum.Text
				? TextMessage(message)
				: message.messageType === MessageTypeEnum.Video
					? VideoMessage(message)
					: message.messageType === MessageTypeEnum.Document
						? DocumentMessage(message)
						: message.messageType === MessageTypeEnum.Image
							? ImageMessage(message)
							: message.messageType === MessageTypeEnum.Audio
								? AudioMessage(message)
								: message.messageType === MessageTypeEnum.Location
									? LocationMessage(message)
									: null}

			<div className="flex flex-col items-center  justify-end gap-1">
				{isActionsEnabled ? (
					<div className="ml-auto">
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger asChild>
								<ChevronDown
									className={clsx(
										'text-bold h-5 w-5',
										message.direction === MessageDirectionEnum.InBound
											? ''
											: ' text-secondary-foreground'
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
				) : null}

				{message.createdAt ? (
					<span
						className={clsx(
							'ml-auto text-[10px]',
							message.direction === MessageDirectionEnum.InBound
								? ''
								: 'text-secondary-foreground'
						)}
					>
						{dayjs(message.createdAt).format('hh:mm A')}
					</span>
				) : null}
			</div>
		</div>
	)
}

export default MessageRenderer
