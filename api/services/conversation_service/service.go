package conversation_service

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/sarthakjdev/wapikit/api/services"
	"github.com/sarthakjdev/wapikit/internal"
	"github.com/sarthakjdev/wapikit/internal/api_server_events"
	"github.com/sarthakjdev/wapikit/internal/api_types"
	"github.com/sarthakjdev/wapikit/internal/interfaces"
)

type ConversationService struct {
	services.BaseService `json:"-,inline"`
}

func NewConversationService() *ConversationService {
	return &ConversationService{
		BaseService: services.BaseService{
			Name:        "Conversation Service",
			RestApiPath: "/api/conversation",
			Routes: []interfaces.Route{
				{
					Path:                    "/api/conversation",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleGetConversations),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Admin,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    100,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
					},
				},
				{
					Path:                    "/api/conversation/assign",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleGetConversations),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Admin,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    100,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
					},
				},
				{
					Path:                    "/api/conversation/unassign",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleGetConversations),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Admin,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    100,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
					},
				},
			},
		},
	}
}

func handleGetConversations(context interfaces.ContextWithSession) error {
	queryParams := new(api_types.GetConversationsParams)

	if err := internal.BindQueryParams(context, &queryParams); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return nil
}

func handleAssignConversation(context interfaces.ContextWithSession) error {
	event := api_server_events.BaseApiServerEvent{
		EventType: api_server_events.ApiServerChatAssignmentEvent,
	}

	internal.PublishMessageToRedisChannel(context.App.Constants.RedisEventChannelName, string(event.ToJson()))

	return nil
}

func handleUnassignConversation(context interfaces.ContextWithSession) error {
	event := api_server_events.BaseApiServerEvent{
		EventType: api_server_events.ApiServerChatUnAssignmentEvent,
	}

	internal.PublishMessageToRedisChannel(context.App.Constants.RedisEventChannelName, string(event.ToJson()))

	return nil
}
