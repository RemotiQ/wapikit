package conversation_controller

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wapikit/wapikit/.db-generated/model"
	"github.com/wapikit/wapikit/.db-generated/table"
	"github.com/wapikit/wapikit/api/api_types"
	controller "github.com/wapikit/wapikit/api/controllers"
	"github.com/wapikit/wapikit/interfaces"
	"github.com/wapikit/wapikit/services/event_service"
	"github.com/wapikit/wapikit/utils"

	"github.com/go-jet/jet/qrm"
	. "github.com/go-jet/jet/v2/postgres"
)

type ConversationController struct {
	controller.BaseController `json:"-,inline"`
}

func NewConversationController() *ConversationController {
	return &ConversationController{
		BaseController: controller.BaseController{
			Name:        "Conversation Controller",
			RestApiPath: "/api/conversation",
			Routes: []interfaces.Route{
				{
					Path:                    "/api/conversations",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleGetConversations),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleGetConversationById),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(handleUpdateConversationById),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.UpdateConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id",
					Method:                  http.MethodDelete,
					Handler:                 interfaces.HandlerWithSession(handleDeleteConversationById),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.DeleteConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id/assign",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(handleAssignConversation),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.AssignConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id/unassign",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(handleUnassignConversation),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.UnassignConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id/messages",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleGetConversationMessages),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id/messages",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(handleSendMessage),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    600,
							WindowTimeInMs: time.Hour.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id/media",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(handleMediaUpload),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    30,
							WindowTimeInMs: time.Minute.Milliseconds(),
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetConversation,
						},
					},
				},
				{
					Path:                    "/api/conversation/:id/media/:mediaId",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleProxyWhatsAppMedia),
					IsAuthorizationRequired: true,
				},
				{
					Path:                    "/api/conversation/:id/read",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(markConversationAsRead),
					IsAuthorizationRequired: true,
				},
			},
		},
	}
}

func handleGetConversations(context interfaces.ContextWithSession) error {
	orgId := context.Session.User.OrganizationId
	orgUuid := uuid.MustParse(orgId)

	fmt.Println("Query Params are:", context.QueryParams())
	queryParams := new(api_types.GetConversationsParams)
	if err := utils.BindQueryParams(context, queryParams); err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	page := queryParams.Page
	limit := queryParams.PerPage
	campaignId := queryParams.CampaignId
	status := queryParams.Status
	// listIds := queryParams.ListId

	if page == 0 || limit > 50 {
		return context.JSON(http.StatusBadRequest, "Invalid page or perPage value")
	}

	type FetchedConversation struct {
		model.Conversation
		Contact struct {
			model.Contact
			ContactLists []struct {
				model.ContactList
			} `json:"contactLists"`
		} `json:"contact"`
		Tags       []model.Tag     `json:"tags"`
		Messages   []model.Message `json:"messages"`
		AssignedTo struct {
			model.OrganizationMember
			User model.User `json:"user"`
		} `json:"assignedTo"`
		NumberOfUnreadMessages int `json:"numberOfUnreadMessages"`
		TotalMessages          int `json:"totalMessages"`
	}

	var fetchedConversations []FetchedConversation

	conversationWhereQuery := table.Conversation.OrganizationId.EQ(UUID(orgUuid))

	if status != nil {
		conversationWhereQuery = conversationWhereQuery.AND(
			table.Conversation.Status.EQ(utils.EnumExpression(string(*status))),
		)
	} else {
		conversationWhereQuery = conversationWhereQuery.AND(
			table.Conversation.Status.NOT_IN(
				utils.EnumExpression(model.ConversationStatusEnum_Deleted.String()),
				utils.EnumExpression(model.ConversationStatusEnum_Closed.String()),
			),
		)
	}

	if campaignId != nil {
		conversationWhereQuery = conversationWhereQuery.AND(table.Conversation.InitiatedByCampaignId.EQ(UUID(uuid.MustParse(*campaignId))))
	}

	conversationCte := CTE("conversations")
	unreadCountCte := CTE("numberOfUnreadMessages")
	paginationMetaCte := CTE("paginationMeta")

	conversationIdColumn := table.Conversation.UniqueId.From(conversationCte)

	// ! TODO: there are complications with including the messages in the conversation query because of unsupported features in the jet library like ARRAY_AGG et. WE WILL NEED TO REVISIT THIS LATER.

	// messagesCte.AS(
	// 	SELECT(
	// 		table.Message.ConversationId,
	// 		Func("array_agg", CustomExpression(
	// 			ROW(
	// 				table.Message.UniqueId,
	// 				table.Message.WhatsAppMessageId,
	// 				table.Message.WhatsappBusinessAccountId,
	// 				table.Message.CreatedAt,
	// 				table.Message.UpdatedAt,
	// 				table.Message.CampaignId,
	// 				table.Message.ContactId,
	// 				table.Message.PhoneNumberUsed,
	// 				table.Message.Direction,
	// 				table.Message.MessageData,
	// 				table.Message.OrganizationId,
	// 				table.Message.Status,
	// 				table.Message.MessageType,
	// 				table.Message.RepliedTo,
	// 			),
	// 			Token("ORDER BY"),
	// 			table.Message.CreatedAt,
	// 		)).AS("messages"),
	// 	).FROM(
	// 		table.Message,
	// 		table.Conversation,
	// 	).WHERE(
	// 		table.Message.ConversationId.IN(
	// 			SELECT(
	// 				table.Conversation.UniqueId,
	// 			).FROM(
	// 				conversationCte,
	// 			),
	// 		),
	// 	).GROUP_BY(
	// 		table.Message.ConversationId,
	// 	).
	// 		LIMIT(50),
	// ),

	conversationQuery := WITH(
		conversationCte.AS(
			SELECT(
				table.Conversation.AllColumns,
				table.Contact.AllColumns,
				table.ContactListContact.AllColumns,
				table.ContactList.AllColumns,
				table.ConversationAssignment.AllColumns,
				table.OrganizationMember.AllColumns,
				table.User.AllColumns,
				table.Tag.AllColumns,
				table.ConversationTag.AllColumns,
			).FROM(table.Conversation.
				LEFT_JOIN(table.Contact, table.Conversation.ContactId.EQ(table.Contact.UniqueId)).
				LEFT_JOIN(table.ContactListContact, table.Contact.UniqueId.EQ(table.ContactListContact.ContactId)).
				LEFT_JOIN(table.ContactList, table.Contact.UniqueId.EQ(table.ContactListContact.ContactId)).
				LEFT_JOIN(table.ConversationAssignment, table.Conversation.UniqueId.EQ(table.ConversationAssignment.ConversationId)).
				LEFT_JOIN(table.OrganizationMember, table.ConversationAssignment.AssignedToOrganizationMemberId.EQ(table.OrganizationMember.UniqueId)).
				LEFT_JOIN(table.User, table.OrganizationMember.UserId.EQ(table.User.UniqueId)).
				LEFT_JOIN(table.ConversationTag, table.Conversation.UniqueId.EQ(table.ConversationTag.ConversationId)).
				LEFT_JOIN(table.Tag, table.ConversationTag.TagId.EQ(table.Tag.UniqueId)),
			).
				WHERE(conversationWhereQuery).
				LIMIT(limit).
				OFFSET((page-1)*limit),
		),
		unreadCountCte.AS(
			SELECT(
				table.Message.ConversationId,
				COALESCE(
					SUM(CASE().
						WHEN(
							table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Sent.String())).
								AND(table.Message.Direction.EQ(utils.EnumExpression(model.MessageDirectionEnum_InBound.String()))),
						).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("numberOfUnreadMessages"),
			).
				FROM(
					table.Message,
				).GROUP_BY(
				table.Message.ConversationId,
			),
		),
		paginationMetaCte.AS(
			SELECT(
				table.Message.ConversationId,
				COUNT(table.Message.UniqueId).AS("totalMessages"),
			).FROM(
				table.Message,
			).
				GROUP_BY(table.Message.ConversationId),
		),
	)(
		SELECT(
			conversationCte.AllColumns(),
			unreadCountCte.AllColumns().As("FetchedConversation"),
			paginationMetaCte.AllColumns().As("FetchedConversation"),
		).FROM(
			conversationCte.
				LEFT_JOIN(
					unreadCountCte, conversationIdColumn.EQ(table.Message.ConversationId.From(unreadCountCte)),
				).LEFT_JOIN(
				paginationMetaCte, conversationIdColumn.EQ(table.Message.ConversationId.From(paginationMetaCte)),
			),
		),
	)

	err := conversationQuery.QueryContext(context.Request().Context(), context.App.Db, &fetchedConversations)

	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	response := api_types.GetConversationsResponseSchema{
		Conversations: make([]api_types.ConversationSchema, 0),
		PaginationMeta: api_types.PaginationMeta{
			Page:    page,
			PerPage: limit,
		},
	}

	for _, conversation := range fetchedConversations {
		attr := map[string]interface{}{}
		json.Unmarshal([]byte(*conversation.Contact.Attributes), &attr)
		campaignId := ""

		if conversation.InitiatedByCampaignId != nil {
			campaignId = string(conversation.InitiatedByCampaignId.String())
		}

		lists := []api_types.ContactListSchema{}

		for _, contactList := range conversation.Contact.ContactLists {
			stringUniqueId := contactList.UniqueId.String()
			listToAppend := api_types.ContactListSchema{
				UniqueId: stringUniqueId,
				Name:     contactList.Name,
			}
			lists = append(lists, listToAppend)
		}

		conversationToAppend := api_types.ConversationSchema{
			UniqueId:               conversation.UniqueId.String(),
			ContactId:              conversation.ContactId.String(),
			OrganizationId:         conversation.OrganizationId.String(),
			InitiatedBy:            api_types.ConversationInitiatedByEnum(conversation.InitiatedBy.String()),
			CampaignId:             &campaignId,
			CreatedAt:              conversation.CreatedAt,
			Status:                 api_types.ConversationStatusEnum(conversation.Status.String()),
			Messages:               []api_types.MessageSchema{},
			NumberOfUnreadMessages: conversation.NumberOfUnreadMessages,
			TotalMessages:          &conversation.TotalMessages,
			Contact: api_types.ContactWithoutConversationSchema{
				UniqueId:   conversation.Contact.UniqueId.String(),
				Name:       conversation.Contact.Name,
				Phone:      conversation.Contact.PhoneNumber,
				Attributes: attr,
				CreatedAt:  conversation.Contact.CreatedAt,
				Status:     api_types.ContactStatusEnum(conversation.Contact.Status.String()),
			},
			Tags: []api_types.TagSchema{},
		}

		context.App.Logger.Info("conversation: %v", conversation.AssignedTo)

		if conversation.AssignedTo.UniqueId != uuid.Nil {
			member := conversation.AssignedTo
			accessLevel := api_types.UserPermissionLevelEnum(member.AccessLevel)
			assignedToOrgMember := api_types.OrganizationMemberSchema{
				CreatedAt:   conversation.AssignedTo.CreatedAt,
				AccessLevel: accessLevel,
				UniqueId:    member.UniqueId.String(),
				Email:       member.User.Email,
				Name:        member.User.Name,
				Roles:       []api_types.OrganizationRoleSchema{},
			}

			conversationToAppend.AssignedTo = &assignedToOrgMember
		}

		for _, tag := range conversation.Tags {
			tagToAppend := api_types.TagSchema{
				UniqueId: tag.UniqueId.String(),
				Label:    tag.Label,
			}
			conversationToAppend.Tags = append(conversationToAppend.Tags, tagToAppend)
		}

		for _, message := range conversation.Messages {
			apiMessage := context.App.ConversationService.ParseDbMessageToApiMessage(message)
			conversationToAppend.Messages = append(conversationToAppend.Messages, apiMessage)
		}

		response.Conversations = append(response.Conversations, conversationToAppend)
	}

	return context.JSON(http.StatusOK, response)
}

func handleGetConversationById(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")

	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)

	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	type FetchedConversation struct {
		model.Conversation
		Contact struct {
			model.Contact
			ContactLists []struct {
				model.ContactList
			} `json:"contactLists"`
		} `json:"contact"`
		Tags       []model.Tag     `json:"tags"`
		Messages   []model.Message `json:"messages"`
		AssignedTo struct {
			model.OrganizationMember
			User model.User `json:"user"`
		} `json:"assignedTo"`
		NumberOfUnreadMessages int `json:"numberOfUnreadMessages"`
	}

	var conversation FetchedConversation

	conversationQuery := SELECT(
		table.Conversation.AllColumns,
		table.Contact.AllColumns,
		table.ContactListContact.AllColumns,
		table.ContactList.AllColumns,
		table.ConversationAssignment.AllColumns,
		table.Message.AllColumns,
		table.Tag.AllColumns,
		table.ConversationTag.AllColumns,
	).FROM(table.Conversation.
		LEFT_JOIN(table.Contact, table.Conversation.ContactId.EQ(table.Contact.UniqueId)).
		LEFT_JOIN(table.ContactListContact, table.Contact.UniqueId.EQ(table.ContactListContact.ContactId)).
		LEFT_JOIN(table.ContactList, table.Contact.UniqueId.EQ(table.ContactListContact.ContactId)).
		LEFT_JOIN(table.ConversationAssignment, table.Conversation.UniqueId.EQ(table.ConversationAssignment.ConversationId)).
		LEFT_JOIN(table.Message, table.Conversation.UniqueId.EQ(table.Message.ConversationId)).
		LEFT_JOIN(table.ConversationTag, table.Conversation.UniqueId.EQ(table.ConversationTag.ConversationId)).
		LEFT_JOIN(table.Tag, table.ConversationTag.TagId.EQ(table.Tag.UniqueId)),
	).
		WHERE(
			table.Conversation.UniqueId.EQ(UUID(conversationUuid)),
		).
		ORDER_BY(
			Raw(` MAX("Message"."CreatedAt") OVER (PARTITION BY "Conversation"."UniqueId") DESC,
			     "Message"."CreatedAt" ASC`,
			),
		)

	err = conversationQuery.QueryContext(context.Request().Context(), context.App.Db, &conversation)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			return context.JSON(http.StatusNotFound, "conversation not found")
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	response := api_types.GetConversationByIdResponseSchema{
		Conversation: api_types.ConversationSchema{},
	}

	attr := map[string]interface{}{}
	json.Unmarshal([]byte(*conversation.Contact.Attributes), &attr)
	campaignId := ""

	if conversation.InitiatedByCampaignId != nil {
		campaignId = string(conversation.InitiatedByCampaignId.String())
	}

	lists := []api_types.ContactListSchema{}

	for _, contactList := range conversation.Contact.ContactLists {
		stringUniqueId := contactList.UniqueId.String()
		listToAppend := api_types.ContactListSchema{
			UniqueId: stringUniqueId,
			Name:     contactList.Name,
		}
		lists = append(lists, listToAppend)
	}

	response.Conversation = api_types.ConversationSchema{
		UniqueId:               conversation.UniqueId.String(),
		ContactId:              conversation.ContactId.String(),
		OrganizationId:         conversation.OrganizationId.String(),
		InitiatedBy:            api_types.ConversationInitiatedByEnum(conversation.InitiatedBy.String()),
		CampaignId:             &campaignId,
		CreatedAt:              conversation.CreatedAt,
		Status:                 api_types.ConversationStatusEnum(conversation.Status.String()),
		Messages:               []api_types.MessageSchema{},
		NumberOfUnreadMessages: conversation.NumberOfUnreadMessages,
		Contact: api_types.ContactWithoutConversationSchema{
			UniqueId:   conversation.Contact.UniqueId.String(),
			Name:       conversation.Contact.Name,
			Phone:      conversation.Contact.PhoneNumber,
			Attributes: attr,
			CreatedAt:  conversation.Contact.CreatedAt,
			Status:     api_types.ContactStatusEnum(conversation.Contact.Status.String()),
		},
		Tags: []api_types.TagSchema{},
	}

	if conversation.AssignedTo.UniqueId != uuid.Nil {
		member := conversation.AssignedTo
		accessLevel := api_types.UserPermissionLevelEnum(member.AccessLevel)
		assignedToOrgMember := api_types.OrganizationMemberSchema{
			CreatedAt:   conversation.AssignedTo.CreatedAt,
			AccessLevel: accessLevel,
			UniqueId:    member.UniqueId.String(),
			Email:       member.User.Email,
			Name:        member.User.Name,
			Roles:       []api_types.OrganizationRoleSchema{},
		}

		response.Conversation.AssignedTo = &assignedToOrgMember
	}

	for _, tag := range conversation.Tags {
		tagToAppend := api_types.TagSchema{
			UniqueId: tag.UniqueId.String(),
			Label:    tag.Label,
		}
		response.Conversation.Tags = append(response.Conversation.Tags, tagToAppend)
	}

	for _, message := range conversation.Messages {
		apiMessage := context.App.ConversationService.ParseDbMessageToApiMessage(message)
		response.Conversation.Messages = append(response.Conversation.Messages, apiMessage)
	}

	return context.JSON(http.StatusOK, response)
}

func handleUpdateConversationById(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	type FetchedConversation struct {
		model.Conversation
		Contact struct {
			model.Contact
			ContactLists []struct {
				model.ContactList
			} `json:"contactLists"`
		} `json:"contact"`
		Tags       []model.Tag     `json:"tags"`
		Messages   []model.Message `json:"messages"`
		AssignedTo struct {
			model.OrganizationMember
			User model.User `json:"user"`
		} `json:"assignedTo"`
		NumberOfUnreadMessages int `json:"numberOfUnreadMessages"`
	}

	context.App.Logger.Info("conversation id: %v", conversationUuid)

	return nil
}

func handleDeleteConversationById(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	context.App.Logger.Info("conversation id: %v", conversationUuid)

	return context.JSON(http.StatusBadRequest, nil)
}

func handleGetConversationMessages(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	queryParams := new(api_types.GetConversationMessagesParams)
	if err := utils.BindQueryParams(context, queryParams); err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	page := queryParams.Page
	limit := queryParams.PerPage

	if page == 0 || limit > 200 {
		return context.JSON(http.StatusBadRequest, "Invalid page or perPage value")
	}

	var dest []struct {
		TotalMessages int `json:"totalMessages"`
		model.Message
	}

	messagesCte := CTE("messages")
	paginationMetaCte := CTE("paginationMeta")

	createdAtMessageColumn := table.Message.CreatedAt.From(messagesCte)

	messageQuery := WITH(
		messagesCte.AS(
			SELECT(
				table.Message.AllColumns,
			).FROM(table.Message).
				WHERE(
					table.Message.ConversationId.EQ(UUID(conversationUuid)),
				).
				ORDER_BY(
					table.Message.CreatedAt.DESC(),
				).
				LIMIT(limit).
				OFFSET((page-1)*limit),
		),
		paginationMetaCte.AS(
			SELECT(
				COUNT(table.Message.UniqueId).AS("totalMessages"),
			).FROM(table.Message).
				WHERE(
					table.Message.ConversationId.EQ(UUID(conversationUuid)),
				),
		),
	)(
		SELECT(
			messagesCte.AllColumns(),
			paginationMetaCte.AllColumns(),
		).FROM(messagesCte, paginationMetaCte).
			ORDER_BY(createdAtMessageColumn.ASC()),
	)

	err = messageQuery.QueryContext(context.Request().Context(), context.App.Db, &dest)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			total := 0
			messages := make([]api_types.MessageSchema, 0)
			return context.JSON(http.StatusOK, api_types.GetConversationMessagesResponseSchema{
				Messages: messages,
				PaginationMeta: api_types.PaginationMeta{
					Page:    page,
					PerPage: limit,
					Total:   total,
				},
			})
		}

		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	messagesToReturn := []api_types.MessageSchema{}
	totalMessages := 0

	if len(dest) > 0 {
		for _, message := range dest {
			apiMessage := context.App.ConversationService.ParseDbMessageToApiMessage(message.Message)
			messagesToReturn = append(messagesToReturn, apiMessage)
		}

		totalMessages = dest[0].TotalMessages
	}

	response := api_types.GetConversationMessagesResponseSchema{
		Messages: messagesToReturn,
		PaginationMeta: api_types.PaginationMeta{
			Page:    page,
			PerPage: limit,
			Total:   totalMessages,
		},
	}

	return context.JSON(http.StatusOK, response)
}

func handleSendMessage(context interfaces.ContextWithSession) error {
	logger := context.App.Logger

	// 1. Validate conversationId
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	// 2. Bind request payload
	payload := new(api_types.NewMessageSchema)
	if err := context.Bind(payload); err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	// 3. Fetch conversation + contact + business account
	var convoData struct {
		model.Conversation
		Contact                 model.Contact
		WhatsappBusinessAccount model.WhatsappBusinessAccount
	}
	err = SELECT(
		table.Conversation.AllColumns,
		table.Contact.AllColumns,
		table.WhatsappBusinessAccount.AllColumns,
	).
		FROM(
			table.Conversation.
				LEFT_JOIN(table.Contact, table.Conversation.ContactId.EQ(table.Contact.UniqueId)).
				LEFT_JOIN(table.WhatsappBusinessAccount, table.WhatsappBusinessAccount.OrganizationId.EQ(table.Conversation.OrganizationId)),
		).
		WHERE(table.Conversation.UniqueId.EQ(UUID(conversationUuid))).
		LIMIT(1).
		QueryContext(context.Request().Context(), context.App.Db, &convoData)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			return context.JSON(http.StatusNotFound, "conversation not found")
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	// 4. Build & send the message
	discriminator, err := payload.MessageData.Discriminator()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	logger.Info("discriminator: %v", discriminator)

	messageComponent, err := context.App.ConversationService.BuildSendMessagePayload(discriminator, payload.MessageData)
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	messagingClient := context.App.WapiClient.NewMessagingClient(convoData.PhoneNumberUsed)
	resp, err := messagingClient.Message.Send(messageComponent, convoData.Contact.PhoneNumber)
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}
	context.App.Logger.Info("response: %v", resp)
	whatsappMessageId := resp.Messages[0].ID

	// 5. Store the message in DB
	messageDataJSON, err := json.Marshal(payload.MessageData)
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}
	stringMessageData := string(messageDataJSON)

	messageToInsert := model.Message{
		ConversationId:            &convoData.UniqueId,
		ContactId:                 convoData.ContactId,
		Direction:                 model.MessageDirectionEnum_OutBound,
		Status:                    model.MessageStatusEnum_Sent,
		MessageType:               model.MessageTypeEnum(discriminator), // override if needed
		OrganizationId:            convoData.OrganizationId,
		WhatsAppMessageId:         &whatsappMessageId,
		WhatsappBusinessAccountId: &convoData.WhatsappBusinessAccount.AccountId,
		PhoneNumberUsed:           convoData.PhoneNumberUsed,
		MessageData:               &stringMessageData,
		CreatedAt:                 time.Now(),
		UpdatedAt:                 time.Now(),
	}

	var insertedMessage model.Message
	if err := table.Message.
		INSERT(table.Message.MutableColumns).
		MODEL(messageToInsert).
		RETURNING(table.Message.AllColumns).
		QueryContext(context.Request().Context(), context.App.Db, &insertedMessage); err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	// 6. Return the new message
	response := api_types.SendMessageInConversationResponseSchema{
		Message: context.App.ConversationService.ParseDbMessageToApiMessage(insertedMessage),
	}
	return context.JSON(http.StatusOK, response)
}

func handleAssignConversation(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	payload := new(api_types.AssignConversationSchema)
	if err := context.Bind(payload); err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	orgMemberUuid, err := uuid.Parse(payload.OrganizationMemberId)

	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid organization member id")
	}

	var conversation struct {
		model.Conversation
		Assignment model.ConversationAssignment
	}

	var organizationMember struct {
		model.OrganizationMember
		User model.User
	}

	conversationFetchQuery := SELECT(
		table.Conversation.AllColumns,
		table.ConversationAssignment.AllColumns,
	).FROM(
		table.Conversation.
			LEFT_JOIN(table.ConversationAssignment, table.Conversation.UniqueId.EQ(table.ConversationAssignment.ConversationId).AND(
				table.ConversationAssignment.Status.EQ(utils.EnumExpression(model.ConversationAssignmentStatus_Assigned.String())),
			)),
	).
		WHERE(
			table.Conversation.UniqueId.EQ(UUID(conversationUuid)),
		).LIMIT(1)

	organizationMemberQuery := SELECT(
		table.OrganizationMember.AllColumns,
		table.User.AllColumns,
	).FROM(
		table.OrganizationMember.LEFT_JOIN(
			table.User, table.OrganizationMember.UserId.EQ(table.User.UniqueId),
		),
	).WHERE(
		table.OrganizationMember.UniqueId.EQ(UUID(orgMemberUuid)),
	).LIMIT(1)

	err = organizationMemberQuery.QueryContext(context.Request().Context(), context.App.Db, &organizationMember)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			return context.JSON(http.StatusNotFound, "organization member not found")
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	err = conversationFetchQuery.QueryContext(context.Request().Context(), context.App.Db, &conversation)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			return context.JSON(http.StatusNotFound, "conversation not found")
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	assignmentToInsert := model.ConversationAssignment{
		ConversationId:                 conversationUuid,
		Status:                         model.ConversationAssignmentStatus_Assigned,
		CreatedAt:                      time.Now(),
		UpdatedAt:                      time.Now(),
		AssignedToOrganizationMemberId: orgMemberUuid,
	}

	// ! update the conversation assignment record and create a new record for new assignment.

	if conversation.Assignment.ConversationId == uuid.Nil {
		unassignFromPreviousMemberCte := CTE("unassign_from_previous_member_cte")
		assignmentUpdateQuery := WITH(
			unassignFromPreviousMemberCte.AS(
				table.ConversationAssignment.UPDATE(table.ConversationAssignment.Status).
					SET(
						table.ConversationAssignment.Status.SET(utils.EnumExpression(model.ConversationAssignmentStatus_Unassigned.String())),
					).
					WHERE(
						table.ConversationAssignment.ConversationId.EQ(UUID(conversationUuid)),
					).
					RETURNING(table.ConversationAssignment.AllColumns),
			),
		)(
			table.ConversationAssignment.
				INSERT().
				MODEL(assignmentToInsert).
				RETURNING(table.ConversationAssignment.AllColumns),
		)

		err = assignmentUpdateQuery.QueryContext(context.Request().Context(), context.App.Db, &assignmentToInsert)

		if err != nil {
			return context.JSON(http.StatusInternalServerError, err.Error())
		}
	} else {
		insertQuery := table.ConversationAssignment.
			INSERT().
			MODEL(assignmentToInsert).
			RETURNING(table.ConversationAssignment.AllColumns)

		err = insertQuery.QueryContext(context.Request().Context(), context.App.Db, &assignmentToInsert)

		if err != nil {
			return context.JSON(http.StatusInternalServerError, err.Error())
		}
	}

	userId := organizationMember.User.UniqueId.String()

	// * send assignment notification to the user
	event := event_service.NewChatAssignmentEvent(
		conversationId,
		&userId,
		&context.Session.User.OrganizationId,
	)

	context.App.Redis.PublishMessageToRedisChannel(context.App.Constants.RedisApiServerEventChannelName, event.ToJson())

	responseToReturn := api_types.AssignConversationResponseSchema{
		Data: true,
	}

	return context.JSON(http.StatusOK, responseToReturn)
}

func handleUnassignConversation(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	var conversation struct {
		model.Conversation
		Assignment struct {
			model.ConversationAssignment
			OrganizationMember struct {
				model.OrganizationMember
				User model.User
			}
		}
	}

	conversationFetchQuery := SELECT(
		table.Conversation.AllColumns,
		table.ConversationAssignment.AllColumns,
		table.OrganizationMember.AllColumns,
		table.User.AllColumns,
	).FROM(
		table.Conversation.
			LEFT_JOIN(table.ConversationAssignment, table.Conversation.UniqueId.EQ(table.ConversationAssignment.ConversationId).AND(
				table.ConversationAssignment.Status.EQ(utils.EnumExpression(model.ConversationAssignmentStatus_Assigned.String())),
			)).LEFT_JOIN(
			table.OrganizationMember, table.ConversationAssignment.AssignedToOrganizationMemberId.EQ(table.OrganizationMember.UniqueId),
		).LEFT_JOIN(
			table.User, table.OrganizationMember.UserId.EQ(table.User.UniqueId),
		),
	).
		WHERE(
			table.Conversation.UniqueId.EQ(UUID(conversationUuid)),
		).LIMIT(1)

	err = conversationFetchQuery.QueryContext(context.Request().Context(), context.App.Db, &conversation)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			return context.JSON(http.StatusNotFound, "conversation not found")
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	updateAssignmentQuery := table.ConversationAssignment.
		UPDATE(table.ConversationAssignment.Status).
		SET(
			table.ConversationAssignment.Status.SET(utils.EnumExpression(model.ConversationAssignmentStatus_Unassigned.String())),
		).
		WHERE(
			table.ConversationAssignment.ConversationId.EQ(UUID(conversationUuid)),
		).
		RETURNING(table.ConversationAssignment.AllColumns)

	err = updateAssignmentQuery.QueryContext(context.Request().Context(), context.App.Db, &conversation.Assignment)

	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	userId := conversation.Assignment.OrganizationMember.User.UniqueId.String()
	// * send un-assignment notification to the user
	redis := context.App.Redis
	event := event_service.NewChatUnAssignmentEvent(
		conversationId,
		&userId,
		&context.Session.User.OrganizationId,
	)

	redis.PublishMessageToRedisChannel(context.App.Constants.RedisApiServerEventChannelName, event.ToJson())

	responseToReturn := api_types.UnassignConversationResponseSchema{
		Data: true,
	}

	return context.JSON(http.StatusOK, responseToReturn)
}

func handleMediaUpload(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}

	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	conversationQuery := SELECT(
		table.Conversation.AllColumns,
	).FROM(
		table.Conversation,
	).WHERE(
		table.Conversation.UniqueId.EQ(UUID(conversationUuid)),
	).LIMIT(1)

	var conversation model.Conversation

	err = conversationQuery.QueryContext(context.Request().Context(), context.App.Db, &conversation)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			return context.JSON(http.StatusNotFound, "conversation not found")
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	// Parse the multipart form (here we allow up to 32 MB in memory)
	if err := context.Request().ParseMultipartForm(32 << 20); err != nil {
		return context.JSON(http.StatusBadRequest, "failed to parse multipart form")
	}

	// Retrieve the file (expecting field name "file")
	file, fileHeader, err := context.Request().FormFile("file")
	if err != nil {
		return context.JSON(http.StatusBadRequest, "file is required")
	}
	defer file.Close()

	// Extract MIME type from header; fallback if needed.
	mimeType := fileHeader.Header.Get("Content-Type")

	if mimeType == "image/gif" {
		mimeType = "video/mp4"
	}

	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	// Get the filename (ensure a safe basename)
	filename := filepath.Base(fileHeader.Filename)

	phoneNumberId := conversation.PhoneNumberUsed
	if phoneNumberId == "" {
		return context.JSON(http.StatusInternalServerError, "phone number id not configured")
	}

	// Use MediaManager to upload the media file to WhatsApp.
	messagingClient := context.App.WapiClient.NewMessagingClient(phoneNumberId)
	mediaManager := messagingClient.Media
	mediaID, err := mediaManager.UploadMedia(phoneNumberId, file, filename, mimeType)
	if err != nil {
		return context.JSON(http.StatusInternalServerError, fmt.Sprintf("upload failed: %v", err))
	}

	// Optionally, retrieve a temporary media URL.
	mediaUrl, err := mediaManager.GetMediaUrlById(mediaID)
	if err != nil {
		// Log the error but we can still proceed with mediaID.
		context.App.Logger.Error("failed to retrieve media URL", err.Error(), nil)
	}

	// Return the media ID and URL to the frontend.
	return context.JSON(http.StatusOK, api_types.UploadFileInConversationResponseSchema{
		MediaId:  mediaID,
		MediaUrl: mediaUrl,
	})
}

func handleProxyWhatsAppMedia(context interfaces.ContextWithSession) error {
	redis := context.App.Redis
	// logger := context.App.Logger

	// 0. Validate conversationId
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}

	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	conversationQuery := SELECT(
		table.Conversation.AllColumns,
		table.Organization.AllColumns,
		table.WhatsappBusinessAccount.AllColumns,
	).FROM(
		table.Conversation.LEFT_JOIN(
			table.Organization, table.Conversation.OrganizationId.EQ(table.Organization.UniqueId),
		).LEFT_JOIN(
			table.WhatsappBusinessAccount, table.WhatsappBusinessAccount.OrganizationId.EQ(table.Organization.UniqueId),
		),
	).WHERE(
		table.Conversation.UniqueId.EQ(UUID(conversationUuid)),
	).LIMIT(1)

	var conversation struct {
		model.Conversation
		Organization            model.Organization
		WhatsappBusinessAccount model.WhatsappBusinessAccount
	}

	err = conversationQuery.QueryContext(context.Request().Context(), context.App.Db, &conversation)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			return context.JSON(http.StatusNotFound, "conversation not found")
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	mediaId := context.Param("mediaId")
	if mediaId == "" {
		return context.JSON(http.StatusBadRequest, "Missing mediaId")
	}

	// Use MediaManager to upload the media file to WhatsApp.
	messagingClient := context.App.WapiClient.NewMessagingClient(conversation.PhoneNumberUsed)
	mediaManager := messagingClient.Media
	if err != nil {
		return context.JSON(http.StatusInternalServerError, fmt.Sprintf("upload failed: %v", err))
	}

	cacheKey := redis.ComputeCacheKey("media", mediaId, "url")
	var mediaUrl string
	ok, err := redis.GetCachedData(cacheKey, &mediaUrl)

	if !ok || err != nil {
		mediaUrl, err = mediaManager.GetMediaUrlById(mediaId)
		if err != nil {
			return context.JSON(http.StatusInternalServerError, fmt.Sprintf("failed to get media url: %v", err))
		}
		redis.CacheData(cacheKey, mediaUrl, time.Minute*4)
	}

	if mediaUrl == "" {
		return context.JSON(http.StatusNotFound, "media url is empty or not found")
	}

	// 3. Build an HTTP GET request to that ephemeral URL, adding your bearer token if needed.
	req, err := http.NewRequest(http.MethodGet, mediaUrl, nil)
	if err != nil {
		return context.JSON(http.StatusInternalServerError, fmt.Sprintf("failed to create request: %v", err))
	}

	// Possibly set an Authorization header, if the ephemeral URL requires your token.
	// For example:
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", conversation.WhatsappBusinessAccount.AccessToken))

	// 4. Execute the request.
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return context.JSON(http.StatusBadGateway, fmt.Sprintf("failed to fetch media from WhatsApp: %v", err))
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return context.JSON(resp.StatusCode, fmt.Sprintf("upstream error: %s", string(bodyBytes)))
	}

	// 5. Copy relevant headers to the response (e.g. Content-Type, Content-Length).
	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	context.Response().Header().Set("Content-Type", contentType)

	// 6. Stream the body directly to the client.
	// If your framework supports returning a "stream" response, you can do that.
	// Otherwise, manually copy the bytes to the Context's writer.

	// Option A: Manually copy the stream:
	_, copyErr := io.Copy(context.Response().Writer, resp.Body)
	if copyErr != nil && !strings.Contains(copyErr.Error(), "broken pipe") {
		// Log or handle partial writes if needed
		context.App.Logger.Error("error streaming media to client", copyErr.Error(), nil)
	}

	return nil
}

func markConversationAsRead(context interfaces.ContextWithSession) error {
	conversationId := context.Param("id")
	if conversationId == "" {
		return context.JSON(http.StatusBadRequest, "conversation id is required")
	}
	conversationUuid, err := uuid.Parse(conversationId)
	if err != nil {
		return context.JSON(http.StatusBadRequest, "invalid conversation id")
	}

	updateQuery := table.Message.UPDATE(table.Message.Status).
		SET(utils.EnumExpression(model.MessageStatusEnum_Read.String())).
		WHERE(
			table.Message.ConversationId.EQ(UUID(conversationUuid)).AND(
				table.Message.Direction.EQ(utils.EnumExpression(model.MessageDirectionEnum_InBound.String())),
			).AND(
				table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Sent.String())),
			),
		)

	_, err = updateQuery.ExecContext(context.Request().Context(), context.App.Db)

	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	return context.JSON(http.StatusOK, api_types.MarkConversationAsReadResponseSchema{
		IsRead: true,
	})
}
