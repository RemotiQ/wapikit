import {
	CampaignStatusEnum,
	ConversationInitiatedByEnum,
	ConversationStatusEnum,
	MessageDirectionEnum,
	MessageStatusEnum
} from 'root/.generated'
import { z } from 'zod'

// 1. Define Event Type Enum
export enum ApiServerEventEnum {
	NewNotification = 'NewNotification',
	NewMessage = 'NewMessage',
	ChatAssignment = 'ChatAssignment',
	ChatUnAssignment = 'ChatUnAssignment',
	Error = 'Error',
	ReloadRequired = 'ReloadRequired',
	ConversationClosed = 'ConversationClosed',
	NewConversation = 'NewConversation',
	CampaignProgress = 'CampaignProgress'
}

export const CampaignStatus = z.nativeEnum(CampaignStatusEnum)
export const MessageStatus = z.nativeEnum(MessageStatusEnum)
export const MessageDirection = z.nativeEnum(MessageDirectionEnum)
export const ConversationStatus = z.nativeEnum(ConversationStatusEnum)
export const ConversationInitiatedBy = z.nativeEnum(ConversationInitiatedByEnum)

// 2️⃣ COMMON SCHEMAS
export const MessageSchema = z.object({
	conversationId: z.string(),
	createdAt: z.string(), // Assuming ISO date string
	direction: MessageDirection,
	messageData: z.record(z.unknown()).optional(),
	message_type: z.string(),
	status: MessageStatus,
	uniqueId: z.string()
})

export const ContactSchema = z.object({
	name: z.string(),
	phone: z.string(),
	status: z.string(),
	uniqueId: z.string()
})

export const ConversationSchema = z.object({
	contact: ContactSchema,
	contactId: z.string(),
	createdAt: z.string(),
	initiatedBy: ConversationInitiatedBy,
	messages: z.array(MessageSchema),
	numberOfUnreadMessages: z.number(),
	organizationId: z.string(),
	status: ConversationStatus,
	uniqueId: z.string()
})

export const NotificationSchema = z.object({
	createdAt: z.string(),
	ctaUrl: z.string().optional(),
	description: z.string(),
	organizationId: z.string().optional(),
	read: z.boolean(),
	title: z.string(),
	type: z.string(),
	uniqueId: z.string()
})

export const CampaignProgress = z.object({
	campaignId: z.string(),
	messagesSent: z.number(),
	messagesErrored: z.number(),
	status: CampaignStatus
})

// 3️⃣ EVENT SCHEMAS
export const BaseApiServerEventSchema = z.object({
	event: z.string(),
	data: z.unknown(),
	userId: z.string().nullable(),
	organizationId: z.string().nullable()
})

export const NewNotificationEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.NewNotification),
	data: z.object({
		notification: NotificationSchema
	})
})

export const MessageEventData = z.object({
	conversation: ConversationSchema,
	message: MessageSchema
})

export const NewMessageEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.NewMessage),
	data: MessageEventData
})

export const ChatAssignmentEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.ChatAssignment),
	data: z.object({
		conversationId: z.string()
	})
})

export const ChatUnAssignmentEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.ChatUnAssignment),
	data: z.object({
		conversationId: z.string()
	})
})

export const ErrorEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.Error),
	data: z.object({
		error: z.string()
	})
})

export const ReloadRequiredEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.ReloadRequired),
	data: z.object({
		isReloadRequired: z.boolean()
	})
})

export const ConversationClosedEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.ConversationClosed),
	data: z.object({
		conversationId: z.string()
	})
})

export const NewConversationEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.NewConversation),
	data: z.object({
		conversation: ConversationSchema
	})
})

export const CampaignProgressEventSchema = BaseApiServerEventSchema.extend({
	event: z.literal(ApiServerEventEnum.CampaignProgress),
	data: CampaignProgress
})

export const ApiServerEventSchema = z.union([
	NewNotificationEventSchema,
	NewMessageEventSchema,
	ChatAssignmentEventSchema,
	ChatUnAssignmentEventSchema,
	ErrorEventSchema,
	ReloadRequiredEventSchema,
	ConversationClosedEventSchema,
	CampaignProgressEventSchema,
	NewConversationEventSchema
])

// 6. Create Event Data Map
export const ApiServerEventDataMap = {
	[ApiServerEventEnum.NewNotification]: NewNotificationEventSchema,
	[ApiServerEventEnum.NewMessage]: MessageEventData,
	[ApiServerEventEnum.ChatAssignment]: ChatAssignmentEventSchema,
	[ApiServerEventEnum.ChatUnAssignment]: ChatUnAssignmentEventSchema,
	[ApiServerEventEnum.Error]: ErrorEventSchema,
	[ApiServerEventEnum.ReloadRequired]: ReloadRequiredEventSchema,
	[ApiServerEventEnum.ConversationClosed]: ConversationClosedEventSchema,
	[ApiServerEventEnum.NewConversation]: NewConversationEventSchema,
	[ApiServerEventEnum.CampaignProgress]: CampaignProgressEventSchema
}
