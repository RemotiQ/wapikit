import { useState } from 'react'
import { getBackendUrl } from '~/constants'
import { useAuthState } from './use-auth-state'

export function useUploadMedia(conversationId?: string) {
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [mediaId, setMediaId] = useState<string | null>(null)
	const [mediaUrl, setMediaUrl] = useState<string | null>(null)
	const { authState } = useAuthState()

	async function uploadMedia(file: File): Promise<{ mediaId: string; mediaUrl: string } | null> {
		if (!conversationId || !authState?.isAuthenticated) {
			return null
		}

		setUploading(true)
		setError(null)

		try {
			// Create a FormData object and append the file.
			const formData = new FormData()
			formData.append('file', file)

			// Use fetch to post the FormData to your backend upload endpoint.
			const response = await fetch(
				`${getBackendUrl()}/conversation/${conversationId}/media`,
				{
					method: 'POST',
					body: formData,
					headers: {
						'x-access-token': authState?.data?.token || ''
					}
				}
			)

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(errorText || 'Upload failed')
			}

			// Parse the JSON response.
			const data = await response.json()
			setMediaId(data.mediaId)
			setMediaUrl(data.mediaUrl)
			return { mediaId: data.mediaId, mediaUrl: data.mediaUrl }
		} catch (err: any) {
			setError(err.message || 'Upload failed')
			throw err
		} finally {
			setUploading(false)
		}
	}

	return { uploadMedia, uploading, error, mediaId, mediaUrl }
}
