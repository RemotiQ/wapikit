package event_service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"

	cache_service "github.com/wapikit/wapikit/services/redis_service"
)

type EventService struct {
	Db                    *sql.DB
	Logger                *slog.Logger
	Redis                 *cache_service.RedisClient
	RedisEventChannelName string
}

func NewEventService(db *sql.DB, logger *slog.Logger, redis *cache_service.RedisClient, channelName string) *EventService {
	return &EventService{
		Db:                    db,
		Logger:                logger,
		Redis:                 redis,
		RedisEventChannelName: channelName,
	}
}

func (service *EventService) HandleApiServerEvents(ctx context.Context) <-chan ApiServerEventInterface {
	service.Logger.Info("Event service is listening for API server events...")
	streamChannel := make(chan ApiServerEventInterface, 1000)

	redisClient := service.Redis
	pubsub := redisClient.Subscribe(ctx, service.RedisEventChannelName)
	redisEventChannel := pubsub.Channel()

	// Goroutine to listen for Redis events
	go func() {
		defer pubsub.Close()

		for {
			select {
			case apiServerEvent, ok := <-redisEventChannel:
				fmt.Println("API SERVER EVENT RECEIVED")
				if !ok {
					service.Logger.Error("Redis event channel closed, stopping event listener.")
					return
				}

				apiServerEventData := []byte(apiServerEvent.Payload)
				var event BaseApiServerEvent
				err := json.Unmarshal(apiServerEventData, &event)
				if err != nil {
					service.Logger.Error("Unable to unmarshal API server event and determine type", err.Error(), nil)
					continue
				}

				service.Logger.Info("API SERVER EVENT OF TYPE", string(event.EventType), nil)

				switch event.EventType {
				case ApiServerNewMessageEvent:
					var newMessageEvent NewMessageEvent
					err := json.Unmarshal(apiServerEventData, &newMessageEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal new message event", err.Error(), nil)
						continue
					}
					streamChannel <- newMessageEvent

				case ApiServerCampaignProgressEvent:
					var campaignProgressEvent CampaignProgressEvent
					err := json.Unmarshal(apiServerEventData, &campaignProgressEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal campaign progress event", err.Error(), nil)
						continue
					}
					streamChannel <- campaignProgressEvent

				case ApiServerNewConversationEvent:
					var newConversationEvent ConversationEvent
					err := json.Unmarshal(apiServerEventData, &newConversationEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal new conversation event", err.Error(), nil)
						continue
					}
					streamChannel <- newConversationEvent

				case ApiServerChatAssignmentEvent:
					var chatAssignmentEvent ChatAssignmentEvent
					err := json.Unmarshal(apiServerEventData, &chatAssignmentEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal chat assignment event", err.Error(), nil)
						continue
					}
					streamChannel <- chatAssignmentEvent

				case ApiServerChatUnAssignmentEvent:
					var chatUnAssignmentEvent ChatUnAssignmentEvent
					err := json.Unmarshal(apiServerEventData, &chatUnAssignmentEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal chat unassignment event", err.Error(), nil)
						continue
					}
					streamChannel <- chatUnAssignmentEvent

				case ApiServerConversationClosedEvent:
					var conversationClosedEvent ConversationClosedEvent
					err := json.Unmarshal(apiServerEventData, &conversationClosedEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal conversation closed event", err.Error(), nil)
						continue
					}
					streamChannel <- conversationClosedEvent

				case ApiServerErrorEvent:
					var errorEvent ErrorEvent
					err := json.Unmarshal(apiServerEventData, &errorEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal error event", err.Error(), nil)
						continue
					}
					streamChannel <- errorEvent

				case ApiServerReloadRequiredEvent:
					var userStatusEvent ReloadRequiredEvent
					err := json.Unmarshal(apiServerEventData, &userStatusEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal user status event", err.Error(), nil)
						continue
					}
					streamChannel <- userStatusEvent

				case ApiServerNewNotificationEvent:
					var newNotificationEvent NotificationEvent
					err := json.Unmarshal(apiServerEventData, &newNotificationEvent)
					if err != nil {
						service.Logger.Error("Unable to unmarshal new notification event", err.Error(), nil)
						continue
					}

				default:
					service.Logger.Info("Unknown event type received")
				}

			case <-ctx.Done(): // Handle context cancellation
				service.Logger.Info("Context cancelled, stopping event stream")
				return
			}
		}
	}()

	return streamChannel
}
