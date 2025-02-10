package notification_service

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wapikit/wapikit/.db-generated/model"
	"github.com/wapikit/wapikit/.db-generated/table"
	"github.com/wapikit/wapikit/api/api_types"
	"github.com/wapikit/wapikit/services/event_service"
	cache_service "github.com/wapikit/wapikit/services/redis_service"
)

type SlackConfig struct {
	SlackWebhookUrl string
	SlackChannel    string
}

type EmailConfig struct {
	Host     string
	Port     string
	Username string
	Password string
}

type NotificationService struct {
	Logger      *slog.Logger
	Redis       *cache_service.RedisClient
	Db          *sql.DB
	SlackConfig *SlackConfig
	EmailConfig *EmailConfig
}

// SlackNotificationParams holds the incoming arguments.
type SlackNotificationParams struct {
	Title   string
	Message string
}

// SlackPayload is the body structure we send to Slack.
type SlackPayload struct {
	Channel string `json:"channel"`
	Text    string `json:"text"`
}

func (ns *NotificationService) SendEmail(sendToEmail string, subject string, body string, isProduction bool) error {
	if !isProduction {
		return nil
	}

	if ns.EmailConfig == nil {
		return fmt.Errorf("email configuration is not set")
	}

	// Compose the email message
	header := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n", ns.EmailConfig.Username, sendToEmail, subject)
	message := header + body

	// Authenticate the sender
	auth := smtp.PlainAuth("", ns.EmailConfig.Username, ns.EmailConfig.Password, ns.EmailConfig.Host)

	address := strings.Join([]string{ns.EmailConfig.Host, ns.EmailConfig.Port}, ":")

	// Send the email
	err := smtp.SendMail(
		address,
		auth,
		ns.EmailConfig.Username,
		[]string{sendToEmail},
		[]byte(message),
	)

	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (ns *NotificationService) SendSlackNotification(params SlackNotificationParams) {
	log.Printf("Sending slack alert for %s", params.Title)

	payload := SlackPayload{
		Channel: ns.SlackConfig.SlackChannel,
		Text:    fmt.Sprintf("*%s*\n\n%s", params.Title, params.Message),
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling Slack payload: %v", err)
		return
	}

	req, err := http.NewRequest("POST", ns.SlackConfig.SlackWebhookUrl, bytes.NewBuffer(bodyBytes))
	if err != nil {
		log.Printf("Error creating Slack request: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Slack request failed: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("Slack request failed with status %d, body: %s", resp.StatusCode, string(respBody))
		return
	}
}

type InAppNotificationParams struct {
	Title                string
	Description          string
	OrganizationMemberId *string
	OrganizationId       *string
	CtaUrl               *string
	IsBroadcast          bool // if broadcast, then this
}

func (ns *NotificationService) SendInAppNotification(params InAppNotificationParams) {
	var orgUuid *uuid.UUID

	if params.OrganizationId != nil {
		orgId, err := uuid.Parse(*params.OrganizationId)
		if err != nil {
			ns.Logger.Error("Error parsing organization ID: %v", err)
			ns.SendSlackNotification(SlackNotificationParams{
				Title:   "🚨Error creating notification🚨",
				Message: fmt.Sprintf("Error parsing organization ID: %v", err),
			})
			return
		}
		orgUuid = &orgId
	}

	var memberUuid *uuid.UUID
	if params.OrganizationMemberId != nil {
		memberId, err := uuid.Parse(*params.OrganizationMemberId)
		if err != nil {
			ns.Logger.Error("Error parsing organization member ID: %v", err)
			ns.SendSlackNotification(SlackNotificationParams{
				Title:   "🚨Error creating notification🚨",
				Message: fmt.Sprintf("Error parsing organization member ID: %v", err),
			})
			return
		}
		memberUuid = &memberId
	}

	notificationToCreate := model.Notification{
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
		CtaUrl:               params.CtaUrl,
		Title:                params.Title,
		Description:          params.Description,
		Type:                 nil,
		OrganizationId:       orgUuid,
		IsBroadcast:          params.IsBroadcast,
		OrganizationMemberId: memberUuid,
	}

	var insertedNotification model.Notification
	insertQuery := table.Notification.INSERT(table.Notification.MutableColumns).MODEL(
		notificationToCreate,
	).RETURNING(table.Notification.AllColumns)
	err := insertQuery.Query(ns.Db, &insertedNotification)

	if err != nil {
		ns.Logger.Error("Error creating notification: %v", err)
		ns.SendSlackNotification(SlackNotificationParams{
			Title:   "🚨Error creating notification🚨",
			Message: fmt.Sprintf("Error creating in-app notification: %v", err),
		})
		return
	}

	event := event_service.NewNewNotificationEvent(
		api_types.NotificationSchema{
			CtaUrl:         insertedNotification.CtaUrl,
			Title:          insertedNotification.Title,
			CreatedAt:      insertedNotification.CreatedAt,
			Description:    insertedNotification.Description,
			Read:           false,
			Type:           *insertedNotification.Type,
			UniqueId:       insertedNotification.UniqueId.String(),
			OrganizationId: params.OrganizationId,
		},
		nil,
	)

	ns.Redis.PublishMessageToRedisChannel(ns.Redis.RedisEventChannelName, event.ToJson())
}
