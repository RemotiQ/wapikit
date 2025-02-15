import React from 'react'
import { type ConversationSchema, MessageTypeEnum } from 'root/.generated'
import { Icons } from '../icons' // Make sure this has the icons used below

interface LastMessagePreviewProps {
	conversation: ConversationSchema
}

const LastMessagePreview: React.FC<LastMessagePreviewProps> = ({ conversation }) => {
	const { messages } = conversation
	if (!messages || messages.length === 0) return null

	const lastMessage = messages[messages.length - 1]

	switch (lastMessage.messageType) {
		case MessageTypeEnum.Text:
			return <p className="text-xs text-gray-500">{lastMessage.messageData?.text || ''}</p>

		case MessageTypeEnum.Image:
			return (
				<div className="flex items-center gap-1 text-xs text-gray-500">
					<Icons.media className="h-4 w-4" />
					<span>Image</span>
				</div>
			)

		case MessageTypeEnum.Video:
			return (
				<div className="flex items-center gap-1 text-xs text-gray-500">
					<Icons.media className="h-4 w-4" />
					<span>Video</span>
				</div>
			)

		case MessageTypeEnum.Audio:
			return (
				<div className="flex items-center gap-1 text-xs text-gray-500">
					<Icons.media className="h-4 w-4" />
					<span>Audio</span>
				</div>
			)

		case MessageTypeEnum.Document:
			return (
				<div className="flex items-center gap-1 text-xs text-gray-500">
					<Icons.file className="h-4 w-4" />
					<span>Document</span>
				</div>
			)

		case MessageTypeEnum.Location:
			return (
				<div className="flex items-center gap-1 text-xs text-gray-500">
					<Icons.pointer className="h-4 w-4" />
					<span>Location</span>
				</div>
			)

		case MessageTypeEnum.Sticker:
			return (
				<div className="flex items-center gap-1 text-xs text-gray-500">
					<Icons.media className="h-4 w-4" />
					<span>Sticker</span>
				</div>
			)

		case MessageTypeEnum.Reaction:
			return (
				<div className="flex items-center gap-1 text-xs text-gray-500">
					<Icons.media className="h-4 w-4" />
					<span>Reaction</span>
				</div>
			)

		default:
			// Fallback if the messageType doesn't match any known type
			return null
	}
}

export default LastMessagePreview
