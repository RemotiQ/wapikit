import { useEffect, useRef, useState } from 'react'
import { getBackendUrl } from '~/constants'
import { useAuthState } from '~/hooks/use-auth-state'
import { useConversationInboxStore } from '~/store/conversation-inbox.store'
import {
	campaignProgressEventHandler,
	conversationAssignedEventHandler,
	conversationClosedEventHandler,
	conversationUnassignedEventHandler,
	messageEventHandler,
	newConversationEventHandler
} from '~/utils/sse-handlers'
import { ApiServerEventDataMap, ApiServerEventEnum } from '~/api-server-events'
import { SseEventSourceStateEnum } from '~/types'
import { useLayoutStore } from '~/store/layout.store'
import { errorNotification } from '~/reusable-functions'
import { type z } from 'zod'
import { decode } from 'msgpack-lite'

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_INTERVAL = 5000

const useServerSideEvents = () => {
	const { authState } = useAuthState()
	const [connectionState, setConnectionState] = useState<SseEventSourceStateEnum>(
		SseEventSourceStateEnum.Disconnected
	)

	const eventSourceRef = useRef<EventSource | null>(null)
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const reconnectAttemptsRef = useRef(0)

	const { writeProperty, conversations } = useConversationInboxStore()
	const { writeProperty: writeLayoutStoreProperty } = useLayoutStore()
	const conversationsRef = useRef(conversations)
	useEffect(() => {
		conversationsRef.current = conversations
	}, [conversations])

	useEffect(() => {
		if (eventSourceRef.current) return

		if (
			!authState?.isAuthenticated ||
			!authState?.data?.token ||
			!authState?.data?.user?.organizationId
		) {
			return
		}

		const connectToSseEndpoint = () => {
			console.log(
				`Attempting SSE connection (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
			)
			setConnectionState(SseEventSourceStateEnum.Connecting)

			const sseUrl = `${getBackendUrl()}/events?token=${authState.data.token}`
			eventSourceRef.current = new EventSource(sseUrl, {
				withCredentials: true
			})

			eventSourceRef.current.onopen = () => {
				console.log('SSE connection established')
				reconnectAttemptsRef.current = 0
				setConnectionState(SseEventSourceStateEnum.Connected)
			}

			Object.entries(ApiServerEventDataMap).forEach(([eventName, schema]) => {
				if (!eventSourceRef.current) return

				eventSourceRef.current.addEventListener(eventName, event => {
					const base64String = event.data as string
					// Decode base64 to a binary string, then to a Uint8Array
					const binaryString = atob(base64String)
					const len = binaryString.length
					const bytes = new Uint8Array(len)
					for (let i = 0; i < len; i++) {
						bytes[i] = binaryString.charCodeAt(i)
					}

					// Decode the MessagePack binary into an object
					const eventData = decode(bytes)
					console.log('Decoded event data:', eventData)
					const result = schema.safeParse(eventData)

					if (!result.success) {
						
						console.error('Invalid event format:', result.error)
						return
					}

					switch (eventName) {
						case String(ApiServerEventEnum.NewMessage):
							return messageEventHandler({
								conversations: conversationsRef.current,
								eventData: result.data as z.infer<
									(typeof ApiServerEventDataMap)[ApiServerEventEnum.NewMessage]
								>,
								writeProperty
							})
						case String(ApiServerEventEnum.ChatAssignment):
							return conversationAssignedEventHandler(event.data)
						case String(ApiServerEventEnum.ChatUnAssignment):
							return conversationUnassignedEventHandler(event.data)
						case String(ApiServerEventEnum.ConversationClosed):
							return conversationClosedEventHandler(event.data)
						case String(ApiServerEventEnum.NewConversation):
							return newConversationEventHandler(
								conversationsRef.current,
								event.data,
								writeProperty
							)
						case String(ApiServerEventEnum.CampaignProgress):
							return campaignProgressEventHandler(event.data)
						case String(ApiServerEventEnum.Error): {
							errorNotification({
								message: event.data
							})
							break
						}
						case String(ApiServerEventEnum.ReloadRequired): {
							writeLayoutStoreProperty({
								isReloadRequired: true
							})
							break
						}
						default:
							return false
					}
				})
			})

			eventSourceRef.current.onerror = error => {
				console.error('SSE connection error:', error)
				setConnectionState(SseEventSourceStateEnum.Disconnected)

				eventSourceRef.current?.close()
				eventSourceRef.current = null

				reconnectAttemptsRef.current++

				if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
					console.error('Maximum reconnect attempts reached. Stopping SSE.')
					return
				}

				// Schedule new reconnect attempt
				if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
				reconnectTimeoutRef.current = setTimeout(connectToSseEndpoint, RECONNECT_INTERVAL)
			}
		}

		connectToSseEndpoint()

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current)
				reconnectTimeoutRef.current = null
			}
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
				eventSourceRef.current = null
			}
			reconnectAttemptsRef.current = 0
			setConnectionState(SseEventSourceStateEnum.Disconnected)
		}
	}, [authState, writeLayoutStoreProperty, writeProperty])

	return { connectionState }
}

export default useServerSideEvents
