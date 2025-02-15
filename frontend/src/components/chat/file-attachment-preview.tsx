import React, { useEffect, useState } from 'react'
import { Icons } from '../icons'
import { type ConversationFileAttachmentType } from '~/types'
import { MessageTypeEnum } from 'root/.generated'

interface PreviewAttachmentProps {
	attachment: ConversationFileAttachmentType
	removeFile: () => void
}

export const PreviewAttachment: React.FC<PreviewAttachmentProps> = ({ removeFile, attachment }) => {
	const { file, fileName, isUploading, mediaType } = attachment

	const [fileUrl, setUrl] = useState('')

	// Revoke the object URL when the component unmounts or the file changes.
	useEffect(() => {
		if (!fileUrl) setUrl(URL.createObjectURL(file))
		return () => {
			URL.revokeObjectURL(fileUrl)
		}
	}, [fileUrl, file])

	const isImage = mediaType === MessageTypeEnum.Image
	const isVideo = mediaType === MessageTypeEnum.Video

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<button
					className="text-xs text-red-500"
					onClick={() => removeFile()}
					disabled={isUploading}
				>
					Remove
				</button>
			</div>

			<div className="relative flex aspect-video h-12 w-16 items-center justify-center rounded-md bg-muted">
				{isImage ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						key={fileUrl}
						src={fileUrl}
						alt={fileName || 'Attachment preview'}
						className="h-full w-full rounded-md object-cover"
					/>
				) : isVideo ? (
					<div className="flex h-full w-full items-center justify-center">
						<Icons.play className="h-6 w-6" />
					</div>
				) : (
					// Fallback icon or element if it's not an image
					<div className="flex h-full w-full items-center justify-center">
						<Icons.file className="h-6 w-6" />
					</div>
				)}

				{isUploading && (
					<div className="absolute animate-spin text-zinc-500">
						<Icons.reload />
					</div>
				)}
			</div>

			<div className="max-w-[5rem] truncate text-xs text-zinc-500">{fileName}</div>
		</div>
	)
}
