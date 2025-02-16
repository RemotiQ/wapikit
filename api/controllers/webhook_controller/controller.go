package webhook_controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	wapi "github.com/wapikit/wapi.go/pkg/client"
	"github.com/wapikit/wapi.go/pkg/events"
	"github.com/wapikit/wapikit/api/api_types"
	controller "github.com/wapikit/wapikit/api/controllers"
	"github.com/wapikit/wapikit/interfaces"
	"github.com/wapikit/wapikit/services/event_service"
	"github.com/wapikit/wapikit/services/notification_service"
	"github.com/wapikit/wapikit/utils"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/go-jet/jet/v2/qrm"
	"github.com/wapikit/wapikit/.db-generated/model"
	table "github.com/wapikit/wapikit/.db-generated/table"
)

type WebhookController struct {
	controller.BaseController `json:"-,inline"`
	handlerMap                map[events.EventType]func(events.BaseEvent, interfaces.App) error
}

func NewWhatsappWebhookWebhookController(wapiClient *wapi.Client) *WebhookController {
	service := &WebhookController{
		BaseController: controller.BaseController{
			Name:        "Webhook Controller",
			RestApiPath: "/api/webhook",
			Routes:      []interfaces.Route{},
		},
	}

	service.BaseController.Routes = []interfaces.Route{
		{
			Path:                    "/api/webhook/whatsapp",
			Method:                  http.MethodGet,
			Handler:                 interfaces.HandlerWithoutSession(service.handleWebhookGetRequest), // Using service method here
			IsAuthorizationRequired: false,
		},
		{
			Path:                    "/api/webhook/whatsapp",
			Method:                  http.MethodPost,
			Handler:                 interfaces.HandlerWithoutSession(service.handleWebhookPostRequest), // Using service method here
			IsAuthorizationRequired: false,
		},
	}

	service.handlerMap = map[events.EventType]func(event events.BaseEvent, app interfaces.App) error{
		events.TextMessageEventType:                  handleTextMessage,
		events.VideoMessageEventType:                 handleVideoMessageEvent,
		events.ImageMessageEventType:                 handleImageMessageEvent,
		events.AccountAlertsEventType:                handleAccountAlerts,
		events.DocumentMessageEventType:              handleDocumentMessageEvent,
		events.AudioMessageEventType:                 handleAudioMessageEvent,
		events.MessageReadEventType:                  handleMessageReadEvent,
		events.SecurityEventType:                     handleSecurityEvent,
		events.ErrorEventType:                        handleErrorEvent,
		events.AdInteractionEventType:                handleAdInteractionEvent,
		events.CustomerNumberChangedEventType:        handlePhoneNumberChangeEvent,
		events.AccountReviewUpdateEventType:          handleAccountReviewUpdateEvent,
		events.AccountUpdateEventType:                handleAccountUpdateEvent,
		events.TemplateMessageEventType:              handleTemplateMessageEvent,
		events.ContactMessageEventType:               handleContactMessageEvent,
		events.ListInteractionMessageEventType:       handleListInteractionMessageEvent,
		events.LocationMessageEventType:              handleLocationMessageEvent,
		events.MessageDeliveredEventType:             handleMessageDeliveredEvent,
		events.MessageFailedEventType:                handleMessageFailedEvent,
		events.QuickReplyMessageEventType:            handleQuickReplyMessageEvent,
		events.ReplyButtonInteractionEventType:       handleReplyButtonInteractionEvent,
		events.ReactionMessageEventType:              handleReactionMessageEvent,
		events.BusinessCapabilityUpdateEventType:     handleBusinessCapabilityUpdateEvent,
		events.ProductInquiryEventType:               handleProductInquiryEvent,
		events.OrderReceivedEventType:                handleOrderReceivedEvent,
		events.StickerMessageEventType:               handleStickerMessageEvent,
		events.MessageUndeliveredEventType:           handleMessageUndeliveredEvent,
		events.CustomerIdentityChangedEventType:      handleCustomerIdentityChangedEvent,
		events.UnknownEventType:                      handleUnknownEvent,
		events.WarnEventType:                         handleWarnEvent,
		events.MessageTemplateStatusUpdateEventType:  handleMessageTemplateUpdateEvent,
		events.MessageTemplateQualityUpdateEventType: handleMessageTemplateQualityUpdateEvent,
		events.PhoneNumberNameUpdateEventType:        handlePhoneNumberNameUpdateEvent,
		events.PhoneNumberQualityUpdateEventType:     handlePhoneNumberQualityUpdateEvent,
	}

	return service

}

func (service *WebhookController) handleWebhookGetRequest(context interfaces.ContextWithoutSession) error {
	decrypter := context.App.EncryptionService
	logger := context.App.Logger
	webhookVerificationToken := context.QueryParam("hub.verify_token")
	logger.Info("webhook verification token", webhookVerificationToken, nil)

	var decryptedDetails utils.WebhookSecretData

	err := decrypter.DecryptData(webhookVerificationToken, &decryptedDetails)
	if err != nil {
		logger.Error("error decrypting webhook verification token", err.Error(), nil)
		return context.JSON(http.StatusBadRequest, "Invalid verification token")
	}

	// * FETCH THE BUSINESS ACCOUNT DETAILS FROM THE DATABASE
	orgUuid, err := uuid.Parse(decryptedDetails.OrganizationId)

	if err != nil {
		logger.Error("error parsing organization id", err.Error(), nil)
		return context.JSON(http.StatusBadRequest, "Invalid organization id")
	}

	whatsappBusinessAccountDetails := SELECT(
		table.WhatsappBusinessAccount.AllColumns,
	).FROM(
		table.WhatsappBusinessAccount,
	).WHERE(
		table.WhatsappBusinessAccount.AccountId.EQ(String(decryptedDetails.WhatsappBusinessAccountId)).AND(
			table.WhatsappBusinessAccount.OrganizationId.EQ(UUID(orgUuid)),
		),
	).LIMIT(1)

	var businessAccount model.WhatsappBusinessAccount

	err = whatsappBusinessAccountDetails.Query(context.App.Db, &businessAccount)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			logger.Error("business account not found", err.Error(), nil)
			return context.JSON(http.StatusNotFound, "Business account not found")
		}
		logger.Error("error fetching business account details", err.Error(), nil)
		return context.JSON(http.StatusInternalServerError, "Internal server error")
	}

	wapiClient := wapi.New(&wapi.ClientConfig{
		BusinessAccountId: businessAccount.AccountId,
		ApiAccessToken:    businessAccount.AccessToken,
		WebhookSecret:     businessAccount.WebhookSecret,
	})

	getHandler := wapiClient.GetWebhookGetRequestHandler()
	getHandler(context)
	return nil
}

type ContactWithAllDetails struct {
	Contact        api_types.ContactWithoutConversationSchema
	OrganizationId string `json:"organizationId"`
}

type BusinessAccountDetails struct {
	api_types.WhatsAppBusinessAccountDetailsSchema
	OrganizationId string `json:"organizationId"`
}

func fetchBusinessAccountDetails(businessAccountId string, app interfaces.App) (*BusinessAccountDetails, error) {
	var dest struct {
		model.WhatsappBusinessAccount
		model.Organization
	}

	// check for cache here
	cacheKey := app.Redis.ComputeCacheKey("business_account_details", businessAccountId, "businessAccountData")

	var businessAccountDetails BusinessAccountDetails
	ok, err := app.Redis.GetCachedData(cacheKey, businessAccountDetails)

	if ok {
		return &businessAccountDetails, nil
	}

	if err != nil {
		// ! skip this
	}

	businessAccountQuery := SELECT(
		table.WhatsappBusinessAccount.AllColumns,
		table.Organization.AllColumns,
	).FROM(
		table.WhatsappBusinessAccount.
			LEFT_JOIN(table.Organization, table.Organization.UniqueId.EQ(table.WhatsappBusinessAccount.OrganizationId)),
	).WHERE(
		table.WhatsappBusinessAccount.AccountId.EQ(String(businessAccountId)),
	).LIMIT(1)

	err = businessAccountQuery.Query(app.Db, &dest)

	if err != nil {
		return nil, err
	}

	businessAccountDetails = BusinessAccountDetails{
		OrganizationId: dest.Organization.UniqueId.String(),
		WhatsAppBusinessAccountDetailsSchema: api_types.WhatsAppBusinessAccountDetailsSchema{
			AccessToken:       dest.WhatsappBusinessAccount.AccessToken,
			BusinessAccountId: dest.WhatsappBusinessAccount.AccountId,
			WebhookSecret:     dest.WhatsappBusinessAccount.WebhookSecret,
		},
	}

	// cache here the data
	app.Redis.CacheData(
		cacheKey,
		businessAccountDetails,
		12*time.Hour,
	)

	return &businessAccountDetails, nil

}

func fetchContact(sentByContactNumber, businessAccountId string, app interfaces.App) (*ContactWithAllDetails, error) {
	var contact struct {
		Contact                 model.Contact
		Organization            model.Organization
		WhatsappBusinessAccount model.WhatsappBusinessAccount
	}

	contactQuery := SELECT(
		table.Contact.AllColumns,
		table.Organization.AllColumns,
		table.WhatsappBusinessAccount.AllColumns).
		FROM(table.Contact.
			LEFT_JOIN(table.Organization, table.Organization.UniqueId.EQ(table.Contact.OrganizationId)).
			LEFT_JOIN(table.WhatsappBusinessAccount, table.WhatsappBusinessAccount.OrganizationId.EQ(table.Organization.UniqueId).
				AND(table.WhatsappBusinessAccount.AccountId.EQ(String(businessAccountId)))),
		).
		WHERE(
			table.Contact.PhoneNumber.EQ(String(sentByContactNumber)).AND(
				table.WhatsappBusinessAccount.AccountId.EQ(String(businessAccountId)),
			),
		).LIMIT(1)

	err := contactQuery.Query(app.Db, &contact)

	if err != nil {
		return nil, err
	}

	attr := map[string]interface{}{}
	json.Unmarshal([]byte(*contact.Contact.Attributes), &attr)

	contactWithAllDetails := ContactWithAllDetails{
		Contact: api_types.ContactWithoutConversationSchema{
			Attributes: attr,
			CreatedAt:  contact.Contact.CreatedAt,
			Name:       contact.Contact.Name,
			Phone:      contact.Contact.PhoneNumber,
			Status:     api_types.ContactStatusEnum(contact.Contact.Status),
			UniqueId:   contact.Contact.UniqueId.String(),
		},
		OrganizationId: contact.Organization.UniqueId.String(),
	}

	return &contactWithAllDetails, nil
}

func fetchConversation(businessAccountId, sentByContactNumber string, app interfaces.App) (*event_service.ConversationWithAllDetails, error) {
	var conversation struct {
		model.Conversation
		Contact struct {
			model.Contact
			ContactLists []struct {
				model.ContactList
			} `json:"contactLists"`
		} `json:"contact"`
		Tags       []model.Tag     `json:"tags"`
		Messages   []model.Message `json:"messages"`
		AssignedTo *struct {
			model.OrganizationMember
			User model.User `json:"user"`
		} `json:"assignedTo"`
		WhatsappBusinessAccount struct {
			model.WhatsappBusinessAccount
			Organization model.Organization `json:"organization"`
		} `json:"whatsappBusinessAccount"`
		NumberOfUnreadMessages int `json:"numberOfUnreadMessages"`
	}

	conversationQuery := SELECT(
		table.Conversation.AllColumns,
		table.WhatsappBusinessAccount.AllColumns,
		table.Organization.AllColumns,
		table.Contact.AllColumns,
		table.ConversationAssignment.AllColumns,
		table.OrganizationMember.AllColumns,
		table.User.AllColumns,
	).FROM(
		table.Conversation.
			LEFT_JOIN(table.Organization, table.Organization.UniqueId.EQ(table.Conversation.OrganizationId)).
			LEFT_JOIN(table.WhatsappBusinessAccount, table.WhatsappBusinessAccount.OrganizationId.EQ(table.Organization.UniqueId)).
			LEFT_JOIN(table.Contact, table.Contact.UniqueId.EQ(table.Conversation.ContactId)).
			LEFT_JOIN(table.ConversationAssignment, table.ConversationAssignment.ConversationId.EQ(table.Conversation.UniqueId)).
			LEFT_JOIN(table.OrganizationMember, table.OrganizationMember.UniqueId.EQ(table.ConversationAssignment.AssignedToOrganizationMemberId)).
			LEFT_JOIN(table.User, table.User.UniqueId.EQ(table.OrganizationMember.UserId)),
	).WHERE(
		table.Conversation.Status.EQ(utils.EnumExpression(model.ConversationStatusEnum_Active.String())).
			AND(table.WhatsappBusinessAccount.AccountId.EQ(String(businessAccountId))).
			AND(table.Contact.PhoneNumber.EQ(String(sentByContactNumber))),
	).LIMIT(1)

	err := conversationQuery.Query(app.Db, &conversation)

	if err != nil {
		return nil, err
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

	conversationDetails := event_service.ConversationWithAllDetails{
		ConversationSchema: api_types.ConversationSchema{
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
		},
		BusinessAccountId: conversation.WhatsappBusinessAccount.AccountId,
		OrganizationId:    conversation.WhatsappBusinessAccount.OrganizationId.String(),
		WhatsAppBusinessAccountDetails: api_types.WhatsAppBusinessAccountDetailsSchema{
			AccessToken:       conversation.WhatsappBusinessAccount.AccessToken,
			BusinessAccountId: conversation.WhatsappBusinessAccount.AccountId,
			WebhookSecret:     conversation.WhatsappBusinessAccount.WebhookSecret,
		},
	}

	if conversation.AssignedTo != nil {
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

		conversationDetails.AssignedTo = &assignedToOrgMember
	}

	for _, tag := range conversation.Tags {
		tagToAppend := api_types.TagSchema{
			UniqueId: tag.UniqueId.String(),
			Label:    tag.Label,
		}
		conversationDetails.Tags = append(conversationDetails.Tags, tagToAppend)
	}

	for _, message := range conversation.Messages {
		apiMessage := app.ConversationService.ParseDbMessageToApiMessage(message)
		conversationDetails.Messages = append(conversationDetails.Messages, apiMessage)
	}

	if err != nil {
		return nil, err
	}

	return &conversationDetails, nil
}

func checkIfInitiatedByCampaign(contactId, orgId string, app interfaces.App) (*uuid.UUID, error) {
	var lastMessage model.Message

	lastMessageQuery := SELECT(
		table.Message.AllColumns,
	).FROM(
		table.Message,
	).WHERE(
		table.Message.ContactId.EQ(UUID(uuid.MustParse(contactId))).AND(
			table.Message.OrganizationId.EQ(UUID(uuid.MustParse(orgId))),
		),
	).ORDER_BY(
		table.Message.CreatedAt.DESC(),
	).LIMIT(1)

	err := lastMessageQuery.Query(app.Db, &lastMessage)

	if err != nil {
		return nil, err
	}

	if lastMessage.CampaignId != nil {
		return lastMessage.CampaignId, nil
	}

	return nil, nil
}

func (service *WebhookController) handleWebhookPostRequest(context interfaces.ContextWithoutSession) error {
	logger := context.App.Logger

	// * Read the request body so we can parse out the businessAccountId.
	bodyBytes, err := io.ReadAll(context.Request().Body)
	if err != nil {
		logger.Error("Error reading request body: %v", err.Error(), nil)
		return context.JSON(http.StatusInternalServerError, "Error reading request body")
	}

	// * Parse JSON to find the businessAccountId.
	var raw map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &raw); err != nil {
		logger.Error("Error unmarshaling JSON: %v", err.Error(), nil)
		return context.JSON(http.StatusBadRequest, "Invalid JSON")
	}

	var businessAccountId string
	if entryList, ok := raw["entry"].([]interface{}); ok && len(entryList) > 0 {
		if firstEntry, ok := entryList[0].(map[string]interface{}); ok {
			logger.Info("firstEntry", firstEntry, nil)
			if id, ok := firstEntry["id"].(string); ok {

				businessAccountId = id
			}
		}
	}

	whatsappBusinessAccountDetails := SELECT(
		table.WhatsappBusinessAccount.AllColumns,
	).FROM(
		table.WhatsappBusinessAccount,
	).WHERE(
		table.WhatsappBusinessAccount.AccountId.EQ(String(businessAccountId)),
	).
		LIMIT(1)

	var businessAccount model.WhatsappBusinessAccount
	err = whatsappBusinessAccountDetails.Query(context.App.Db, &businessAccount)
	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			logger.Error("business account not found", err.Error(), nil)
			return context.JSON(http.StatusNotFound, "Business account not found")
		}
		return context.JSON(http.StatusInternalServerError, "Internal server error")
	}

	// 3) Reset the body so the wapiClient can read it again.
	context.Request().Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// 4) Create the wapiClient with the discovered businessAccountId
	wapiClient := wapi.New(&wapi.ClientConfig{
		BusinessAccountId: businessAccountId,
		ApiAccessToken:    businessAccount.AccessToken,
		WebhookSecret:     businessAccount.WebhookSecret,
	})

	for eventType, handler := range service.handlerMap {
		//  ! TODO: a middleware here which parses the required event handler parameter and type cast it to the corresponding type
		wapiClient.On(eventType, func(event events.BaseEvent) {
			handler(event, context.App)
		})
	}

	postHandler := wapiClient.GetWebhookPostRequestHandler()
	err = postHandler(context)

	if err != nil {
		return context.JSON(http.StatusInternalServerError, "Internal server error")
	}

	return context.JSON(http.StatusOK, "Success")
}

func _preHandlerHook(app interfaces.App, businessAccountId string, phoneNumber events.BusinessPhoneNumber, sentByContactNumber, sentByName string) (*event_service.ConversationWithAllDetails, error) {
	conversationDetailsToReturn := &event_service.ConversationWithAllDetails{}
	businessAccount, err := fetchBusinessAccountDetails(businessAccountId, app)
	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			// ! it must be in rare case, because th webhook should not be get to the application, if somebody has a account or running instance and added the webhook details in the whatsapp business account, then it should be in the database
			app.Logger.Error("business account not found", err.Error(), nil)
		}

		app.Logger.Error("error fetching business account details", err.Error(), nil)
		// ! TODO: send notification to the team
		return nil, fmt.Errorf("error fetching business account details")

	} else {
		// * business account found, add it to the response object
		conversationDetailsToReturn.BusinessAccountId = businessAccountId
	}

	var contactWithAllDetails ContactWithAllDetails

	contact, err := fetchContact(sentByContactNumber, businessAccountId, app)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			app.Logger.Info("No contact found adding this person to the contacts", err.Error(), nil)
			emptyAttributes := "{}"
			contactToAdd := model.Contact{
				PhoneNumber:    sentByContactNumber,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
				OrganizationId: uuid.MustParse(businessAccount.OrganizationId),
				Status:         model.ContactStatusEnum_Active,
				Name:           sentByName,
				Attributes:     &emptyAttributes,
			}

			var insertedContact model.Contact
			insertQuery := table.Contact.INSERT(table.Contact.MutableColumns).
				MODEL(contactToAdd).
				RETURNING(table.Contact.AllColumns)
			err = insertQuery.Query(app.Db, &insertedContact)
			if err != nil {
				return nil, fmt.Errorf("error inserting contact in the database")
			}

			attr := map[string]interface{}{}
			json.Unmarshal([]byte(*insertedContact.Attributes), &attr)

			contactWithAllDetails = ContactWithAllDetails{
				Contact: api_types.ContactWithoutConversationSchema{
					Attributes: attr,
					CreatedAt:  insertedContact.CreatedAt,
					Name:       insertedContact.Name,
					Phone:      insertedContact.PhoneNumber,
					Status:     api_types.ContactStatusEnum(insertedContact.Status),
					UniqueId:   insertedContact.UniqueId.String(),
				},
				OrganizationId: insertedContact.OrganizationId.String(),
			}
		} else {
			// ! TODO: send notification to the team
			app.NotificationService.SendSlackNotification(notification_service.SlackNotificationParams{
				Title:   "🚨🚨  Error inserting contact in webhook pre-handler 🚨🚨",
				Message: fmt.Sprintf("Error fetching contact with phone number %s", sentByContactNumber),
			})

			return nil, fmt.Errorf("error inserting contact in the database")
		}
	} else {
		// * contact found, add it to the response object
		contactWithAllDetails = *contact
	}

	fetchedConversation, err := fetchConversation(businessAccountId, sentByContactNumber, app)

	if err != nil {
		if err.Error() == qrm.ErrNoRows.Error() {
			app.Logger.Info("No conversation found, creating a new conversation", err.Error(), nil)
			// * here we need to get the last message from this contact and if possibly a campaign Id exists for that contact, because then this message will be considered to be as initiated by that campaign
			initiatedByCampaignId, _ := checkIfInitiatedByCampaign(contactWithAllDetails.Contact.UniqueId, contactWithAllDetails.OrganizationId, app)

			// * this is a new message from the user, so we need to create a new conversation
			conversationToInsert := model.Conversation{
				CreatedAt:             time.Now(),
				UpdatedAt:             time.Now(),
				ContactId:             uuid.MustParse(contactWithAllDetails.Contact.UniqueId),
				OrganizationId:        uuid.MustParse(businessAccount.OrganizationId),
				PhoneNumberUsed:       phoneNumber.Id,
				InitiatedByCampaignId: initiatedByCampaignId,
				InitiatedBy:           model.ConversationInitiatedEnum_Contact,
				Status:                model.ConversationStatusEnum_Active,
			}

			var insertedConversation model.Conversation
			insertQuery := table.Conversation.INSERT(table.Conversation.MutableColumns).
				MODEL(conversationToInsert).
				RETURNING(table.Conversation.AllColumns)
			err = insertQuery.Query(app.Db, &insertedConversation)
			if err != nil {
				return nil, fmt.Errorf("error inserting conversation in the database")
			}

			campaignId := ""
			if insertedConversation.InitiatedByCampaignId != nil {
				campaignId = string(insertedConversation.InitiatedByCampaignId.String())
			}

			conversationDetailsToReturn.ConversationSchema = api_types.ConversationSchema{
				UniqueId:               insertedConversation.UniqueId.String(),
				CreatedAt:              insertedConversation.CreatedAt,
				ContactId:              insertedConversation.ContactId.String(),
				OrganizationId:         insertedConversation.OrganizationId.String(),
				Status:                 api_types.ConversationStatusEnum(insertedConversation.Status.String()),
				InitiatedBy:            api_types.ConversationInitiatedByEnum(insertedConversation.InitiatedBy.String()),
				CampaignId:             &campaignId,
				Contact:                contactWithAllDetails.Contact,
				AssignedTo:             nil,
				Messages:               []api_types.MessageSchema{},
				NumberOfUnreadMessages: 0,
				Tags:                   []api_types.TagSchema{},
			}

			conversationDetailsToReturn.OrganizationId = businessAccount.OrganizationId

			// * send an event to the client for creating new conversation
			newConversationEvent := event_service.NewConversationEvent(*conversationDetailsToReturn)
			app.Redis.PublishMessageToRedisChannel(app.Constants.RedisApiServerEventChannelName, newConversationEvent.ToJson())

			return conversationDetailsToReturn, nil
		} else {
			return nil, fmt.Errorf("error fetching conversation from the database")
		}
	}

	return fetchedConversation, nil
}

func _processIncomingMessage(
	app interfaces.App,
	businessAccountId string,
	phoneNumber events.BusinessPhoneNumber,
	messageId string,
	baseEvent events.BaseMessageEvent,
	messageData interface{},
	msgType model.MessageTypeEnum,
) error {
	// 1. Convert timestamp from string to time.Time.
	unixTimestamp, err := strconv.ParseInt(baseEvent.Timestamp, 10, 64)
	if err != nil {
		app.Logger.Error("error parsing timestamp", err.Error(), nil)
		return err
	}
	sentAtTime := time.Unix(unixTimestamp, 0)
	sentByContactNumber := baseEvent.From
	sentByName := baseEvent.SenderName

	// 2. Get conversation details via preHandlerHook.
	conversationDetails, err := _preHandlerHook(app, businessAccountId, phoneNumber, sentByContactNumber, sentByName)
	if err != nil {
		app.Logger.Error("error fetching conversation details", err.Error(), nil)
		return err
	}

	// 3. Marshal the message-specific data into JSON.
	jsonMessageData, err := json.Marshal(messageData)
	if err != nil {
		return err
	}
	stringMessageData := string(jsonMessageData)

	// 4. Build the model.Message record.
	conversationUuid := uuid.MustParse(conversationDetails.UniqueId)
	contactUuid := uuid.MustParse(conversationDetails.Contact.UniqueId)

	messageToInsert := model.Message{
		WhatsAppMessageId:         &messageId,
		WhatsappBusinessAccountId: &businessAccountId,
		ConversationId:            &conversationUuid,
		CampaignId:                nil, // For incoming messages, campaign is nil.
		ContactId:                 contactUuid,
		MessageType:               msgType,
		Status:                    model.MessageStatusEnum_Sent,
		Direction:                 model.MessageDirectionEnum_InBound,
		MessageData:               &stringMessageData,
		OrganizationId:            uuid.MustParse(conversationDetails.OrganizationId),
		PhoneNumberUsed:           phoneNumber.Id,
		CreatedAt:                 sentAtTime,
		UpdatedAt:                 time.Now(),
	}

	var insertedMessage model.Message
	insertQuery := table.Message.
		INSERT(table.Message.MutableColumns).
		MODEL(messageToInsert).
		RETURNING(table.Message.AllColumns)
	err = insertQuery.Query(app.Db, &insertedMessage)
	if err != nil {
		app.Logger.Error("error inserting message in the database", err.Error(), nil)
		return err
	}

	// 5. Parse DB record to API message and publish event.
	messageParsed := app.ConversationService.ParseDbMessageToApiMessage(insertedMessage)
	messageEvent := event_service.NewNewMessageEvent(*conversationDetails, messageParsed, nil, &conversationDetails.OrganizationId)
	err = app.Redis.PublishMessageToRedisChannel(app.Constants.RedisApiServerEventChannelName, messageEvent.ToJson())
	if err != nil {
		app.Logger.Error("error sending api server event", err)
		return err
	}

	return nil
}

// _processMessageStatusUpdate unifies the logic for updating message status
// - newStatus: The new status to set (e.g., model.MessageStatusEnum_Read, Delivered, Failed).
func _processMessageStatusUpdate(messageId string, app interfaces.App, newStatus model.MessageStatusEnum) error {
	// Query the message from the DB using WhatsAppMessageId.
	messageQuery := SELECT(
		table.Message.AllColumns,
		table.Organization.AllColumns,
		table.Conversation.AllColumns,
	).FROM(
		table.Message.
			LEFT_JOIN(table.Organization, table.Organization.UniqueId.EQ(table.Message.OrganizationId)).
			LEFT_JOIN(table.Conversation, table.Conversation.UniqueId.EQ(table.Message.ConversationId)),
	).WHERE(
		table.Message.WhatsAppMessageId.EQ(String(messageId)),
	)

	var message struct {
		model.Message
		Organization model.Organization
		Conversation model.Conversation
	}

	err := messageQuery.Query(app.Db, &message)
	if err != nil {
		app.Logger.Error("error fetching message from the database", err.Error(), nil)
		// We ignore the event if the message is not found.
		return nil
	}

	// Update the message status in the database.
	updateQuery := table.Message.UPDATE(table.Message.Status).
		SET(newStatus).
		WHERE(table.Message.WhatsAppMessageId.EQ(String(messageId)))

	_, err = updateQuery.Exec(app.Db)
	if err != nil {
		app.Logger.Error("error updating message status", err.Error(), nil)
		// Continue processing even if status update fails.
	}

	orgId := message.Organization.UniqueId.String()

	var sse event_service.ApiServerEventInterface

	switch newStatus {
	case model.MessageStatusEnum_Read:
		{
			sse = event_service.NewMessageReadEvent(message.UniqueId.String(), &orgId)
			break
		}

	case model.MessageStatusEnum_Delivered:
		{

			sse = event_service.NewMessageDeliveredEvent(message.UniqueId.String(), &orgId)
			break
		}

	case model.MessageStatusEnum_Failed:
		{
			sse = event_service.NewMessageFailedEvent(message.UniqueId.String(), &orgId)
			break
		}

	default:

	}

	err = app.Redis.PublishMessageToRedisChannel(app.Constants.RedisApiServerEventChannelName, sse.ToJson())
	if err != nil {
		app.Logger.Error("error sending api server event", err)
		return err
	}

	return nil
}

func handleTextMessage(event events.BaseEvent, app interfaces.App) error {
	textMessageEvent := event.(*events.TextMessageEvent)

	err := _processIncomingMessage(
		app,
		textMessageEvent.BusinessAccountId,
		textMessageEvent.PhoneNumber,
		textMessageEvent.MessageId,
		textMessageEvent.BaseMessageEvent,
		api_types.TextMessageData{Text: textMessageEvent.Text},
		model.MessageTypeEnum_Text,
	)

	if err != nil {
		app.Logger.Error("error processing incoming text message", err.Error(), nil)
		return err
	}

	return nil

	// ! TODO: quick actions, AI automation replies and other stuff will be added in the future version here
	// ! check for quick action, now feature flag must be checked here
	// ! if quick action keywords are enabled then send a quick reply
}

func handleVideoMessageEvent(event events.BaseEvent, app interfaces.App) error {
	videoMessageEvent := event.(*events.VideoMessageEvent)
	err := _processIncomingMessage(
		app,
		videoMessageEvent.BusinessAccountId,
		videoMessageEvent.PhoneNumber,
		videoMessageEvent.MessageId,
		videoMessageEvent.BaseMessageEvent,
		api_types.VideoMessageData{
			Id:      videoMessageEvent.Video.Id,
			Link:    &videoMessageEvent.Video.Link,
			Caption: &videoMessageEvent.Video.Caption,
		},
		model.MessageTypeEnum_Video,
	)

	if err != nil {
		app.Logger.Error("error processing incoming video message", err.Error(), nil)
		return err
	}

	return nil
}

func handleImageMessageEvent(event events.BaseEvent, app interfaces.App) error {
	imageMessageEvent := event.(*events.ImageMessageEvent)

	err := _processIncomingMessage(
		app,
		imageMessageEvent.BusinessAccountId,
		imageMessageEvent.PhoneNumber,
		imageMessageEvent.MessageId,
		imageMessageEvent.BaseMessageEvent,
		api_types.ImageMessageData{
			Id:      imageMessageEvent.Image.Id,
			Link:    &imageMessageEvent.Image.Link,
			Caption: &imageMessageEvent.Image.Caption,
		},
		model.MessageTypeEnum_Image,
	)

	if err != nil {
		app.Logger.Error("error processing incoming image message", err.Error(), nil)
		return err
	}

	return nil
}

func handleDocumentMessageEvent(event events.BaseEvent, app interfaces.App) error {
	documentMessageEvent := event.(*events.DocumentMessageEvent)
	err := _processIncomingMessage(
		app,
		documentMessageEvent.BusinessAccountId,
		documentMessageEvent.PhoneNumber,
		documentMessageEvent.MessageId,
		documentMessageEvent.BaseMessageEvent,
		api_types.DocumentMessageData{},
		model.MessageTypeEnum_Document,
	)

	if err != nil {
		app.Logger.Error("error processing incoming document message", err.Error(), nil)
		return err
	}

	return nil
}

func handleAudioMessageEvent(event events.BaseEvent, app interfaces.App) error {
	audioMessageEvent := event.(*events.AudioMessageEvent)
	err := _processIncomingMessage(
		app,
		audioMessageEvent.BusinessAccountId,
		audioMessageEvent.PhoneNumber,
		audioMessageEvent.MessageId,
		audioMessageEvent.BaseMessageEvent,
		api_types.AudioMessageData{
			Id:   audioMessageEvent.Audio.Id,
			Link: &audioMessageEvent.Audio.Link,
		},
		model.MessageTypeEnum_Audio,
	)

	if err != nil {
		app.Logger.Error("error processing incoming audio message", err.Error(), nil)
		return err
	}

	return nil
}

func handleStickerMessageEvent(event events.BaseEvent, app interfaces.App) error {
	stickerMessageEvent := event.(*events.StickerMessageEvent)

	err := _processIncomingMessage(
		app,
		stickerMessageEvent.BusinessAccountId,
		stickerMessageEvent.PhoneNumber,
		stickerMessageEvent.MessageId,
		stickerMessageEvent.BaseMessageEvent,
		api_types.StickerMessageData{
			Id:   stickerMessageEvent.MediaId,
			Link: nil,
		},
		model.MessageTypeEnum_Sticker,
	)

	if err != nil {
		app.Logger.Error("error processing incoming sticker message", err.Error(), nil)
		return err
	}

	return nil
}

func handleLocationMessageEvent(event events.BaseEvent, app interfaces.App) error {
	locationMessageEvent := event.(*events.LocationMessageEvent)
	err := _processIncomingMessage(
		app,
		locationMessageEvent.BusinessAccountId,
		locationMessageEvent.PhoneNumber,
		locationMessageEvent.MessageId,
		locationMessageEvent.BaseMessageEvent,
		api_types.LocationMessageData{
			Address:   &locationMessageEvent.Location.Address,
			Latitude:  locationMessageEvent.Location.Latitude,
			Longitude: locationMessageEvent.Location.Longitude,
			Name:      &locationMessageEvent.Location.Name,
		},
		model.MessageTypeEnum_Sticker,
	)

	if err != nil {
		app.Logger.Error("error processing incoming location message", err.Error(), nil)
		return err
	}

	return nil
}

func handleReactionMessageEvent(event events.BaseEvent, app interfaces.App) error {
	reactionMessageEvent := event.(*events.ReactionMessageEvent)
	err := _processIncomingMessage(
		app,
		reactionMessageEvent.BusinessAccountId,
		reactionMessageEvent.PhoneNumber,
		reactionMessageEvent.MessageId,
		reactionMessageEvent.BaseMessageEvent,
		api_types.ReactionMessageData{
			Reaction:  reactionMessageEvent.Reaction.Emoji,
			MessageId: &reactionMessageEvent.Reaction.MessageId,
		},
		model.MessageTypeEnum_Sticker,
	)

	if err != nil {
		app.Logger.Error("error processing incoming reaction message", err.Error(), nil)
		return err
	}

	return nil
}

func handleQuickReplyMessageEvent(event events.BaseEvent, app interfaces.App) error {

	return nil
}

func handleContactMessageEvent(event events.BaseEvent, app interfaces.App) error {
	return nil
}

func handleMessageReadEvent(event events.BaseEvent, app interfaces.App) error {
	messageReadEvent := event.(*events.MessageReadEvent)
	messageId := messageReadEvent.MessageId

	err := _processMessageStatusUpdate(messageId, app, model.MessageStatusEnum_Read)

	if err != nil {
		app.Logger.Error("error sending api server event", "error", err.Error())
		return err
	}

	return nil
}

func handleMessageDeliveredEvent(event events.BaseEvent, app interfaces.App) error {
	messageDelivered := event.(*events.MessageDeliveredEvent)
	messageId := messageDelivered.MessageId

	err := _processMessageStatusUpdate(messageId, app, model.MessageStatusEnum_Delivered)

	if err != nil {
		app.Logger.Error("error sending api server event", err)
		return err
	}

	return nil
}

func handleMessageFailedEvent(event events.BaseEvent, app interfaces.App) error {
	messageFailedEvent := event.(*events.MessageFailedEvent)
	messageId := messageFailedEvent.MessageId

	err := _processMessageStatusUpdate(messageId, app, model.MessageStatusEnum_Failed)
	if err != nil {
		app.Logger.Error("error sending api server event", err)
		return err
	}
	return nil
}

func handleMessageUndeliveredEvent(event events.BaseEvent, app interfaces.App) error {
	return nil
}

func handlePhoneNumberChangeEvent(event events.BaseEvent, app interfaces.App) error {

	// ! check for the contact in the database

	// ! change the phone number
	// send an api_server_event to webhook

	return nil

}

func handleSecurityEvent(event events.BaseEvent, app interfaces.App) error {
	// send an api_server_event to webhook

	return nil

}

func handleAccountAlerts(event events.BaseEvent, app interfaces.App) error {
	// send an api_server_event to webhook

	return nil

}

func handleAdInteractionEvent(event events.BaseEvent, app interfaces.App) error {
	// send an api_server_event to webhook

	return nil

}

func handleErrorEvent(event events.BaseEvent, app interfaces.App) error {
	// send an api_server_event to webhook

	return nil

}

func handleAccountReviewUpdateEvent(event events.BaseEvent, app interfaces.App) error {
	return nil

}

func handleAccountUpdateEvent(event events.BaseEvent, app interfaces.App) error {

	return nil

}

func handleTemplateMessageEvent(event events.BaseEvent, app interfaces.App) error {

	return nil

}

func handleListInteractionMessageEvent(event events.BaseEvent, app interfaces.App) error {
	return nil
}

func handleReplyButtonInteractionEvent(event events.BaseEvent, app interfaces.App) error {
	return nil
}

func handleBusinessCapabilityUpdateEvent(event events.BaseEvent, app interfaces.App) error {
	return nil
}

func handleProductInquiryEvent(event events.BaseEvent, app interfaces.App) error {
	return nil
}

func handleOrderReceivedEvent(event events.BaseEvent, app interfaces.App) error {
	return nil
}

func handleCustomerIdentityChangedEvent(event events.BaseEvent, app interfaces.App) error {
	// ! TODO:
	// ! 1. check if the customer exists in the database
	// ! 2. update the customer identity
	// ! 3. send an api_server_event to websocket server to logout the user if connected, else send a notification to the user to login again
	return nil
}

func handleUnknownEvent(event events.BaseEvent, app interfaces.App) error {
	// ! TODO: in this handle we need to save the log in the database

	return nil

}

func handleWarnEvent(event events.BaseEvent, app interfaces.App) error {
	app.NotificationService.SendSlackNotification(notification_service.SlackNotificationParams{
		Title:   "🟡🟡 Warning in webhook controller 🟡🟡",
		Message: fmt.Sprintf("Warning in webhook controller: %s"),
	})
	return nil
}

func handleMessageTemplateUpdateEvent(event events.BaseEvent, app interfaces.App) error {

	return nil
}

func handleMessageTemplateQualityUpdateEvent(event events.BaseEvent, app interfaces.App) error {

	return nil
}

func handlePhoneNumberNameUpdateEvent(event events.BaseEvent, app interfaces.App) error {

	return nil
}

func handlePhoneNumberQualityUpdateEvent(event events.BaseEvent, app interfaces.App) error {

	return nil
}
