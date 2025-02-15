import type { z } from 'zod'
import { type ApiServerEventDataMap, type ApiServerEventEnum } from '../api-server-events'
import { type ConversationInboxStoreType } from '~/store/conversation-inbox.store'
import { type MessageSchema, type ConversationSchema } from 'root/.generated'

export function messageEventHandler(params: {
	conversations: ConversationSchema[]
	eventData: z.infer<(typeof ApiServerEventDataMap)[ApiServerEventEnum.NewMessage]>
	writeProperty: ConversationInboxStoreType['writeProperty']
}): boolean {
	try {
		const { conversations, eventData, writeProperty } = params
		const conversation = conversations.find(
			convo => convo.uniqueId === eventData.message.conversationId
		)

		console.log({ conversation })

		if (!conversation) {
			return false
		}

		const updatedConversation: ConversationSchema = {
			...conversation,
			messages: [...conversation.messages, eventData.message as MessageSchema]
		}

		writeProperty({
			conversations: conversations.map(convo =>
				convo.uniqueId === conversation.uniqueId ? updatedConversation : convo
			)
		})

		return true
	} catch (error) {
		console.error(error)
		return false
	}
}

export function conversationAssignedEventHandler(
	message: z.infer<
		(typeof ApiServerEventDataMap)[ApiServerEventEnum.ChatAssignment]['shape']['data']
	>
): boolean {
	try {
		const { conversationId } = message
		console.log({ conversationId })

		// ! get the conversation from the store
		// ! update the conversation with the new assignee

		// ! show a notification that the conversation has been assigned if the conversation is assigned to the current user

		return true

		// ! append the above message to the conversation
	} catch (error) {
		console.error(error)
		return false
	}
}

export function conversationUnassignedEventHandler(
	message: z.infer<
		(typeof ApiServerEventDataMap)[ApiServerEventEnum.ChatUnAssignment]['shape']['data']
	>
) {
	try {
		const { conversationId } = message
		console.log({ conversationId })

		return true
	} catch (error) {
		console.error(error)
		return false
	}
}

export function conversationClosedEventHandler(
	message: z.infer<
		(typeof ApiServerEventDataMap)[ApiServerEventEnum.ConversationClosed]['shape']['data']
	>
) {
	try {
		const { conversationId } = message
		console.log({ conversationId })

		return true
	} catch (error) {
		console.error(error)
		return false
	}
}

export function newConversationEventHandler(
	conversations: ConversationSchema[],
	message: z.infer<
		(typeof ApiServerEventDataMap)[ApiServerEventEnum.NewConversation]['shape']['data']
	>,
	writeProperty: ConversationInboxStoreType['writeProperty']
) {
	try {
		const { conversation } = message
		writeProperty({
			conversations: [conversation as ConversationSchema, ...conversations]
		})
		return true
	} catch (error) {
		console.error(error)
		return false
	}
}

export function campaignProgressEventHandler(
	progress: z.infer<
		(typeof ApiServerEventDataMap)[ApiServerEventEnum.CampaignProgress]['shape']['data']
	>
) {
	try {
		const { campaignId, messagesErrored, messagesSent, status } = progress
		console.log({ campaignId, messagesErrored, messagesSent, status })

		return true
	} catch (error) {
		console.error(error)
		return false
	}
}
