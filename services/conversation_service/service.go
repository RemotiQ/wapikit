package conversation_service

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/wapikit/wapi.go/pkg/components"
	"github.com/wapikit/wapikit/.db-generated/model"
	"github.com/wapikit/wapikit/api/api_types"
	cache_service "github.com/wapikit/wapikit/services/redis_service"
	"github.com/wapikit/wapikit/utils"
)

type ConversationService struct {
	Logger *slog.Logger
	Redis  *cache_service.RedisClient
	Db     *sql.DB
}

// NewConversationService creates a new instance of the ConversationService
func NewConversationService(db *sql.DB, logger *slog.Logger, redis *cache_service.RedisClient) *ConversationService {
	return &ConversationService{
		Logger: logger,
		Redis:  redis,
		Db:     db,
	}
}

func (service *ConversationService) ParseDbMessageToApiMessage(message model.Message) api_types.MessageSchema {
	var apiMsg api_types.MessageSchema
	// For each message type, we create a concrete instance,
	// populate the common (base) fields, and then use the corresponding FromX function
	// to set the union.
	// We'll try to extract the raw union data if present.
	var rawData map[string]interface{}
	if message.MessageData != nil {
		_ = json.Unmarshal([]byte(*message.MessageData), &rawData)
	}

	switch message.MessageType {
	case model.MessageTypeEnum_Text:
		textMessageData, err := utils.ConvertMapToStruct[api_types.TextMessageData](rawData)
		if err != nil {
			service.Logger.Error("failed to convert message data to text message data", err.Error(), nil)
			return apiMsg
		}

		textMsg := api_types.TextMessage{
			UniqueId:       message.UniqueId.String(),
			ConversationId: message.ConversationId.String(),
			CreatedAt:      message.CreatedAt,
			Direction:      api_types.MessageDirectionEnum(message.Direction.String()),
			MessageType:    api_types.Text,
			Status:         api_types.MessageStatusEnum(message.Status.String()),
			MessageData:    *textMessageData,
		}
		_ = apiMsg.FromTextMessage(textMsg)

	case model.MessageTypeEnum_Audio:
		audioMessageData, err := utils.ConvertMapToStruct[api_types.AudioMessageData](rawData)
		if err != nil {
			service.Logger.Error("failed to convert message data to text message data", err.Error(), nil)
			return apiMsg
		}
		audioMsg := api_types.AudioMessage{
			UniqueId:       message.UniqueId.String(),
			ConversationId: message.ConversationId.String(),
			CreatedAt:      message.CreatedAt,
			Direction:      api_types.MessageDirectionEnum(message.Direction.String()),
			MessageType:    api_types.Audio,
			Status:         api_types.MessageStatusEnum(message.Status.String()),
			MessageData:    *audioMessageData,
		}
		_ = apiMsg.FromAudioMessage(audioMsg)

	case model.MessageTypeEnum_Video:
		videoMessageData, err := utils.ConvertMapToStruct[api_types.VideoMessageData](rawData)
		if err != nil {
			service.Logger.Error("failed to convert message data to text message data", err.Error(), nil)
			return apiMsg
		}
		videoMsg := api_types.VideoMessage{
			UniqueId:       message.UniqueId.String(),
			ConversationId: message.ConversationId.String(),
			CreatedAt:      message.CreatedAt,
			Direction:      api_types.MessageDirectionEnum(message.Direction.String()),
			MessageType:    api_types.Video,
			Status:         api_types.MessageStatusEnum(message.Status.String()),
			MessageData:    *videoMessageData,
		}
		_ = apiMsg.FromVideoMessage(videoMsg)

	case model.MessageTypeEnum_Image:
		imageMessageData, err := utils.ConvertMapToStruct[api_types.ImageMessageData](rawData)
		if err != nil {
			service.Logger.Error("failed to convert message data to text message data", err.Error(), nil)
			return apiMsg
		}
		imageMsg := api_types.ImageMessage{
			UniqueId:       message.UniqueId.String(),
			ConversationId: message.ConversationId.String(),
			CreatedAt:      message.CreatedAt,
			Direction:      api_types.MessageDirectionEnum(message.Direction.String()),
			MessageType:    api_types.Image,
			Status:         api_types.MessageStatusEnum(message.Status.String()),
			MessageData:    *imageMessageData,
		}
		_ = apiMsg.FromImageMessage(imageMsg)

	case model.MessageTypeEnum_Document:
		documentMessageData, err := utils.ConvertMapToStruct[api_types.DocumentMessageData](rawData)
		if err != nil {
			service.Logger.Error("failed to convert message data to text message data", err.Error(), nil)
			return apiMsg
		}
		documentMsg := api_types.DocumentMessage{
			UniqueId:       message.UniqueId.String(),
			ConversationId: message.ConversationId.String(),
			CreatedAt:      message.CreatedAt,
			Direction:      api_types.MessageDirectionEnum(message.Direction.String()),
			MessageType:    api_types.Document,
			Status:         api_types.MessageStatusEnum(message.Status.String()),
			MessageData:    *documentMessageData,
		}
		_ = apiMsg.FromDocumentMessage(documentMsg)

	case model.MessageTypeEnum_Sticker:
		stickerMessageData, err := utils.ConvertMapToStruct[api_types.StickerMessageData](rawData)
		if err != nil {
			service.Logger.Error("failed to convert message data to text message data", err.Error(), nil)
			return apiMsg
		}
		stickerMsg := api_types.StickerMessage{
			UniqueId:       message.UniqueId.String(),
			ConversationId: message.ConversationId.String(),
			CreatedAt:      message.CreatedAt,
			Direction:      api_types.MessageDirectionEnum(message.Direction.String()),
			MessageType:    api_types.Sticker,
			Status:         api_types.MessageStatusEnum(message.Status.String()),
			MessageData:    *stickerMessageData,
		}
		_ = apiMsg.FromStickerMessage(stickerMsg)

	case model.MessageTypeEnum_Reaction:
		reactionMessageData, err := utils.ConvertMapToStruct[api_types.ReactionMessageData](rawData)
		if err != nil {
			service.Logger.Error("failed to convert message data to text message data", err.Error(), nil)
			return apiMsg
		}

		reactionMsg := api_types.ReactionMessage{
			UniqueId:       message.UniqueId.String(),
			ConversationId: message.ConversationId.String(),
			CreatedAt:      message.CreatedAt,
			Direction:      api_types.MessageDirectionEnum(message.Direction.String()),
			MessageType:    api_types.Reaction,
			Status:         api_types.MessageStatusEnum(message.Status.String()),
			MessageData:    *reactionMessageData,
		}
		_ = apiMsg.FromReactionMessage(reactionMsg)

	default:
		service.Logger.Error("unsupported message type", message.MessageType.String(), nil)
	}

	return apiMsg
}

func (service *ConversationService) BuildSendMessagePayload(messageType string, data api_types.NewMessageDataSchema) (components.BaseMessage, error) {
	// Marshal the incoming data into JSON, then unmarshal into a map for conversion.
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	var dataMap map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &dataMap); err != nil {
		return nil, err
	}

	switch messageType {
	case string(api_types.Text):
		textData, err := utils.ConvertMapToStruct[api_types.TextMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		textMsg, err := components.NewTextMessage(components.TextMessageConfigs{
			Text: textData.Text,
		})
		if err != nil {
			return nil, err
		}
		return textMsg, nil

	case string(api_types.Audio):
		audioData, err := utils.ConvertMapToStruct[api_types.AudioMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		audioMsg, err := components.NewAudioMessage(components.AudioMessageConfigs{
			Id: audioData.Id,
		})
		if err != nil {
			return nil, err
		}
		return audioMsg, nil

	case string(api_types.Location):
		locationData, err := utils.ConvertMapToStruct[api_types.LocationMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		locationMsg, err := components.NewLocationMessage(float64(locationData.Latitude), float64(locationData.Longitude))
		if err != nil {
			return nil, err
		}
		if locationData.Address != nil {
			locationMsg.SetAddress(*locationData.Address)
		}
		if locationData.Name != nil {
			locationMsg.SetName(*locationData.Name)
		}
		return locationMsg, nil

	case string(api_types.Video):
		videoData, err := utils.ConvertMapToStruct[api_types.VideoMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		videoMsg, err := components.NewVideoMessage(components.VideoMessageConfigs{
			Id: videoData.Id,
		})
		if err != nil {
			return nil, err
		}
		return videoMsg, nil

	case string(api_types.Image):
		imageData, err := utils.ConvertMapToStruct[api_types.ImageMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		imageMsg, err := components.NewImageMessage(components.ImageMessageConfigs{
			Id:      imageData.Id,
			Caption: *imageData.Caption,
		})
		if err != nil {
			return nil, err
		}
		return imageMsg, nil

	case string(api_types.Document):
		// documentData, err := utils.ConvertMapToStruct[api_types.DocumentMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		documentMsg, err := components.NewDocumentMessage(components.DocumentMessageConfigs{
			// ! TODO: Add document configs
		})
		if err != nil {
			return nil, err
		}
		return documentMsg, nil

	case string(api_types.Sticker):
		stickerData, err := utils.ConvertMapToStruct[api_types.StickerMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		stickerMsg, err := components.NewStickerMessage(&components.StickerMessageConfigs{
			Id: stickerData.Id,
		})
		if err != nil {
			return nil, err
		}
		return stickerMsg, nil

	case string(api_types.Reaction):
		reactionData, err := utils.ConvertMapToStruct[api_types.ReactionMessageData](dataMap)
		if err != nil {
			return nil, err
		}
		reactionMsg, err := components.NewReactionMessage(components.ReactionMessageParams{
			Emoji:     reactionData.Reaction,
			MessageId: *reactionData.MessageId,
		})
		if err != nil {
			return nil, err
		}
		return reactionMsg, nil

	default:
		return nil, fmt.Errorf("unsupported message type: %s", messageType)
	}
}

func (service *ConversationService) GetUnreadMessagesCountByConversationId(conversationId string) (int, error) {
	// query := "SELECT COUNT(*) FROM messages WHERE conversation_id = $1 AND status = $2"
	// var count int
	// err := service.Db.QueryRow(query, conversationId, model.MessageStatusEnum_Unread).Scan(&count)
	// if err != nil {
	// 	return 0, err
	// }
	// return count, nil

	return 0, nil
}

// this function will called on layout to show the unread messages dot to the user
// this is not just specific to organization but specific to user as well
func (service *ConversationService) DoOrgHasUnreadMessages(ordId string, userId string) (bool, error) {

	return false, nil
}
