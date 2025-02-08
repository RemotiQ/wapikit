package event_service

import (
	"encoding/json"
	"log"

	"github.com/wapikit/wapikit/api/api_types"
)

type ApiServerEventType string

const (
	ApiServerNewNotificationEvent    ApiServerEventType = "NewNotification"
	ApiServerNewMessageEvent         ApiServerEventType = "NewMessage"
	ApiServerChatAssignmentEvent     ApiServerEventType = "ChatAssignment"
	ApiServerChatUnAssignmentEvent   ApiServerEventType = "ChatUnAssignment"
	ApiServerErrorEvent              ApiServerEventType = "Error"
	ApiServerReloadRequiredEvent     ApiServerEventType = "ReloadRequired"
	ApiServerConversationClosedEvent ApiServerEventType = "ConversationClosed"
	ApiServerNewConversationEvent    ApiServerEventType = "NewConversation"
	ApiServerCampaignProgressEvent   ApiServerEventType = "CampaignProgress"
)

type EventAuthDetails struct {
	UserId         *string
	OrganizationId *string
}

type ApiServerEventInterface interface {
	ToJson() []byte
	GetEventType() ApiServerEventType
	GetData() interface{}
	GetAuthDetails() *EventAuthDetails
}

type ConversationWithAllDetails struct {
	api_types.ConversationSchema
	BusinessAccountId              string                                         `json:"businessAccountId"`
	OrganizationId                 string                                         `json:"organizationId"`
	WhatsAppBusinessAccountDetails api_types.WhatsAppBusinessAccountDetailsSchema `json:"whatsAppBusinessAccountDetails"`
}

type BaseApiServerEvent struct {
	EventType      ApiServerEventType `json:"event"`
	Data           interface{}        `json:"data"`
	UserId         *string            `json:"userId"`
	OrganizationId *string            `json:"organizationId"`
}

func (event BaseApiServerEvent) ToJson() []byte {
	bytes, err := json.Marshal(event)
	if err != nil {
		log.Print(err)
	}
	return bytes
}

func (event BaseApiServerEvent) GetEventType() ApiServerEventType {
	return event.EventType
}

func (event BaseApiServerEvent) GetData() interface{} {
	return event.Data
}

func (event BaseApiServerEvent) GetAuthDetails() *EventAuthDetails {
	return &EventAuthDetails{
		UserId:         event.UserId,
		OrganizationId: event.OrganizationId,
	}
}

// Specific event types with properly structured Data

type NotificationEvent struct {
	BaseApiServerEvent
}

func NewNewNotificationEvent(notification api_types.NotificationSchema, userId *string) *NotificationEvent {
	return &NotificationEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType:      ApiServerNewNotificationEvent,
			UserId:         userId,
			OrganizationId: notification.OrganizationId,
			Data: struct {
				Notification api_types.NotificationSchema `json:"notification"`
			}{
				Notification: notification,
			},
		},
	}
}

type NewMessageEvent struct {
	BaseApiServerEvent
}

func NewNewMessageEvent(conv ConversationWithAllDetails, msg api_types.MessageSchema, userId, orgId *string) *NewMessageEvent {
	return &NewMessageEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType: ApiServerNewMessageEvent,
			Data: struct {
				Conversation ConversationWithAllDetails `json:"conversation"`
				Message      api_types.MessageSchema    `json:"message"`
			}{
				Conversation: conv,
				Message:      msg,
			},
			UserId:         userId,
			OrganizationId: orgId,
		},
	}
}

type ChatAssignmentEvent struct {
	BaseApiServerEvent
}

func NewChatAssignmentEvent(conversationId string, userId, orgId *string) *ChatAssignmentEvent {
	return &ChatAssignmentEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType: ApiServerChatAssignmentEvent,
			Data: struct {
				ConversationId string `json:"conversationId"`
			}{
				ConversationId: conversationId,
			},
			UserId:         userId,
			OrganizationId: orgId,
		},
	}
}

type ChatUnAssignmentEvent struct {
	BaseApiServerEvent
}

func NewChatUnAssignmentEvent(conversationId string, userId, orgId *string) *ChatUnAssignmentEvent {
	return &ChatUnAssignmentEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType:      ApiServerChatUnAssignmentEvent,
			UserId:         userId,
			OrganizationId: orgId,
			Data: struct {
				ConversationId string `json:"conversationId"`
			}{
				ConversationId: conversationId,
			},
		},
	}
}

type ErrorEvent struct {
	BaseApiServerEvent
}

func NewErrorEvent(errorMsg string, userId, orgId *string) *ErrorEvent {
	return &ErrorEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType:      ApiServerErrorEvent,
			UserId:         userId,
			OrganizationId: orgId,
			Data: struct {
				Error string `json:"error"`
			}{
				Error: errorMsg,
			},
		},
	}
}

type ReloadRequiredEvent struct {
	BaseApiServerEvent
}

func NewReloadRequiredEvent(isReloadRequired bool, userId, orgId *string) *ReloadRequiredEvent {
	return &ReloadRequiredEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType:      ApiServerReloadRequiredEvent,
			UserId:         userId,
			OrganizationId: orgId,
			Data: struct {
				IsReloadRequired bool `json:"isReloadRequired"`
			}{
				IsReloadRequired: isReloadRequired,
			},
		},
	}
}

type ConversationClosedEvent struct {
	BaseApiServerEvent
}

func NewConversationClosedEvent(conversationId string, userId, orgId *string) *ConversationClosedEvent {
	return &ConversationClosedEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType:      ApiServerConversationClosedEvent,
			UserId:         userId,
			OrganizationId: orgId,
			Data: struct {
				ConversationId string `json:"conversationId"`
			}{
				ConversationId: conversationId,
			},
		},
	}
}

type ConversationEvent struct {
	BaseApiServerEvent
}

func NewConversationEvent(conv ConversationWithAllDetails) *ConversationEvent {
	return &ConversationEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType:      ApiServerNewConversationEvent,
			OrganizationId: &conv.OrganizationId,
			Data: struct {
				Conversation ConversationWithAllDetails `json:"conversation"`
			}{
				Conversation: conv,
			},
		},
	}
}

type CampaignProgressEventData struct {
	CampaignId      string                       `json:"campaignId"`
	MessagesSent    int64                        `json:"messagesSent"`
	MessagesErrored int64                        `json:"messagesErrored"`
	Status          api_types.CampaignStatusEnum `json:"status"`
}

type CampaignProgressEvent struct {
	BaseApiServerEvent
}

func NewCampaignProgressEvent(campaignId string, messagesSent, messagesErrored int64, status api_types.CampaignStatusEnum) *CampaignProgressEvent {
	return &CampaignProgressEvent{
		BaseApiServerEvent: BaseApiServerEvent{
			EventType: ApiServerCampaignProgressEvent,
			Data: CampaignProgressEventData{
				CampaignId:      campaignId,
				MessagesSent:    messagesSent,
				MessagesErrored: messagesErrored,
				Status:          status,
			},
		},
	}
}
