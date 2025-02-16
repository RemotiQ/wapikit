import {
	CampaignStatusEnum,
	ConversationInitiatedByEnum,
	ConversationStatusEnum,
	MessageDirectionEnum,
	MessageStatusEnum,
	MessageTypeEnum
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
export const MessageType = z.nativeEnum(MessageTypeEnum)

// 2️⃣ COMMON SCHEMAS
// The base message schema with shared fields.
export const BaseMessageSchema = z.object({
	uniqueId: z.string(),
	conversationId: z.string(),
	direction: MessageDirection,
	status: MessageStatus,
	messageType: MessageType,
	createdAt: z.string()
})

// 3a. Text Message
const TextMessageDataSchema = z.object({
	text: z.string()
})

export const TextMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Text'),
	messageData: TextMessageDataSchema
})

// 3b. Audio Message
const AudioMessageDataSchema = z.object({
	id: z.string(),
	link: z.string().url()
})
export const AudioMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Audio'),
	messageData: AudioMessageDataSchema
})

// 3c. Video Message
const VideoMessageDataSchema = z.object({
	id: z.string(),
	link: z.string().url()
})
export const VideoMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Video'),
	messageData: VideoMessageDataSchema
})

// 3d. Image Message
const ImageMessageDataSchema = z.object({
	id: z.string(),
	link: z.string().url(),
	caption: z.string().optional()
})
export const ImageMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Image'),
	messageData: ImageMessageDataSchema
})

// 3e. Document Message
const DocumentMessageDataSchema = z.object({
	id: z.string(),
	link: z.string().url()
})
export const DocumentMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Document'),
	messageData: DocumentMessageDataSchema
})

// 3f. Sticker Message
const StickerMessageDataSchema = z.object({
	id: z.string(),
	link: z.string().url()
})
export const StickerMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Sticker'),
	messageData: StickerMessageDataSchema
})

// 3g. Reaction Message
const ReactionMessageDataSchema = z.object({
	reaction: z.string(),
	messageId: z.string().optional()
})
export const ReactionMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Reaction'),
	messageData: ReactionMessageDataSchema
})

// 3h. Location Message
const LocationMessageDataSchema = z.object({
	latitude: z.number(),
	longitude: z.number(),
	address: z.string().optional(),
	name: z.string().optional()
})
export const LocationMessageSchema = BaseMessageSchema.extend({
	messageType: z.literal('Location'),
	messageData: LocationMessageDataSchema
})

export const ContactSchema = z.object({
	name: z.string(),
	phone: z.string(),
	status: z.string(),
	uniqueId: z.string()
})

export const MessageSchema = z.discriminatedUnion('messageType', [
	TextMessageSchema,
	AudioMessageSchema,
	VideoMessageSchema,
	ImageMessageSchema,
	DocumentMessageSchema,
	StickerMessageSchema,
	ReactionMessageSchema,
	LocationMessageSchema
])

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
