//go:build managed_cloud
// +build managed_cloud

package interfaces

import (
	"database/sql"
	"log/slog"

	"github.com/golang-jwt/jwt"
	"github.com/knadh/koanf/v2"
	"github.com/knadh/stuffbin"
	"github.com/labstack/echo/v4"

	wapi "github.com/wapikit/wapi.go/pkg/client"
	enterprise_interfaces "github.com/wapikit/wapikit-enterprise/interfaces"
	ai_service "github.com/wapikit/wapikit-enterprise/services/ai"
	quota_service "github.com/wapikit/wapikit-enterprise/services/quota"
	subscription_service "github.com/wapikit/wapikit-enterprise/services/subscription"
	"github.com/wapikit/wapikit/api/api_types"
	"github.com/wapikit/wapikit/internal/campaign_manager"
	"github.com/wapikit/wapikit/services/encryption_service"
	"github.com/wapikit/wapikit/services/event_service"
	"github.com/wapikit/wapikit/services/notification_service"
	cache_service "github.com/wapikit/wapikit/services/redis_service"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/wapikit/wapikit-enterprise/.db-generated/model"
	"github.com/wapikit/wapikit-enterprise/.db-generated/table"
)

type App struct {
	Db                  *sql.DB
	Redis               *cache_service.RedisClient
	WapiClient          *wapi.Client
	Logger              slog.Logger
	Koa                 *koanf.Koanf
	Fs                  stuffbin.FileSystem
	Constants           *Constants
	CampaignManager     *campaign_manager.CampaignManager
	AiService           *ai_service.AiService
	EncryptionService   *encryption_service.EncryptionService
	NotificationService *notification_service.NotificationService
	EventService        *event_service.EventService
}

type RateLimitConfig struct {
	MaxRequests    int   `json:"maxRequests"`
	WindowTimeInMs int64 `json:"windowTime"`
}

type RouteMetaData struct {
	PermissionRoleLevel  api_types.UserPermissionLevelEnum `json:"permissionRoleLevel"`
	RequiredPermission   []api_types.RolePermissionEnum    `json:"requiredPermission"`
	RateLimitConfig      RateLimitConfig                   `json:"rateLimitConfig"`
	RequiredFeatureFlags []string                          `json:"requiredFeatureFlags"`
}

type Route struct {
	Path                    string `json:"path"`
	Method                  string `json:"method"`
	Handler                 Handler
	IsAuthorizationRequired bool
	MetaData                RouteMetaData `json:"metaData"`
}

type ApiController interface {
	Register(server *echo.Echo)
	GetControllerName() string
}

type Handler interface {
	Handle(context echo.Context) error
}

type HandlerWithoutSession func(context ContextWithoutSession) error

func (eh HandlerWithoutSession) Handle(context echo.Context) error {
	return eh(context.(ContextWithoutSession))
}

type HandlerWithSession func(context ContextWithSession) error

func (ch HandlerWithSession) Handle(context echo.Context) error {
	return ch(context.(ContextWithSession))
}

type ContextWithSession struct {
	echo.Context        `json:",inline"`
	App                 App                                                    `json:"app,omitempty"`
	Session             ContextSession                                         `json:"session,omitempty"`
	UserIp              string                                                 `json:"user_ip,omitempty"`
	UserCountry         string                                                 `json:"user_country,omitempty"`
	SubscriptionDetails *enterprise_interfaces.OrganizationSubscriptionDetails `json:"subscription_details,omitempty"`
}

type ContextWithoutSession struct {
	echo.Context `json:",inline"`
	App          App    `json:"app,omitempty"`
	UserIp       string `json:"user_ip,omitempty"`
	UserCountry  string `json:"user_country,omitempty"`
}

func (ctx *ContextWithoutSession) GetSessionDetailsIfAuthenticated(jwtSecret string, db *sql.DB) (*ContextSession, bool) {
	authToken := ctx.Request().Header.Get("x-access-token")

	if authToken == "" {
		return nil, false
	}

	parsedPayload, err := jwt.Parse(authToken, func(token *jwt.Token) (interface{}, error) {
		if jwtSecret == "" {
			return "", nil
		}
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return "", nil
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, false
	}

	if parsedPayload.Valid {
		castedPayload := parsedPayload.Claims.(jwt.MapClaims)
		type UserWithOrgDetails struct {
			model.User
			Organizations []struct {
				model.Organization
				WhatsappBusinessAccount *model.WhatsappBusinessAccount
				MemberDetails           struct {
					model.OrganizationMember
					AssignedRoles []struct {
						model.RoleAssignment
						role model.OrganizationRole
					}
				}
			}
		}

		email := castedPayload["email"].(string)
		uniqueId := castedPayload["unique_id"].(string)
		organizationId := castedPayload["organization_id"].(string)

		if email == "" || uniqueId == "" {
			return nil, false
		}

		user := UserWithOrgDetails{}
		userQuery := SELECT(
			table.User.AllColumns,
			table.OrganizationMember.AllColumns,
			table.Organization.AllColumns,
			table.WhatsappBusinessAccount.AllColumns,
			table.RoleAssignment.AllColumns,
			table.OrganizationRole.AllColumns,
		).FROM(
			table.User.
				LEFT_JOIN(table.OrganizationMember, table.User.UniqueId.EQ(table.OrganizationMember.UserId)).
				LEFT_JOIN(table.Organization, table.Organization.UniqueId.EQ(table.OrganizationMember.OrganizationId)).
				LEFT_JOIN(table.WhatsappBusinessAccount, table.WhatsappBusinessAccount.OrganizationId.EQ(table.Organization.UniqueId)).
				LEFT_JOIN(table.RoleAssignment, table.OrganizationMember.UniqueId.EQ(table.RoleAssignment.OrganizationMemberId)).
				LEFT_JOIN(table.OrganizationRole, table.RoleAssignment.OrganizationRoleId.EQ(table.OrganizationRole.UniqueId)),
		).WHERE(
			table.User.Email.EQ(String(email)),
		)

		userQuery.QueryContext(ctx.Request().Context(), db, &user)

		if user.User.UniqueId.String() == "" || user.User.Status != model.UserAccountStatusEnum_Active {
			return nil, false
		}

		if organizationId == "" {
			session := ContextSession{
				Token: authToken,
				User: ContextUser{
					UniqueId: user.User.UniqueId.String(),
					Username: user.User.Username,
					Email:    user.User.Email,
					Name:     user.User.Name,
				},
			}

			return &session, true
		}

		for _, org := range user.Organizations {
			if org.Organization.UniqueId.String() == organizationId {
				session := ContextSession{
					Token: authToken,
					User: ContextUser{
						UniqueId:       user.User.UniqueId.String(),
						Username:       user.User.Username,
						Email:          user.User.Email,
						Role:           api_types.UserPermissionLevelEnum(org.MemberDetails.AccessLevel),
						Name:           user.User.Name,
						OrganizationId: org.Organization.UniqueId.String(),
					},
				}
				return &session, true
			}
		}

		return nil, false
	}

	return nil, false
}

func BuildContextWithoutSession(ctx echo.Context, app App, userIp, userCountry string) ContextWithoutSession {
	return ContextWithoutSession{
		Context:     ctx,
		App:         app,
		UserIp:      userIp,
		UserCountry: userCountry,
	}
}

func BuildContextWithSession(ctx echo.Context, app App, session ContextSession, userIp, userCountry string) ContextWithSession {
	context := ContextWithSession{
		Context:     ctx,
		App:         app,
		Session:     session,
		UserIp:      userIp,
		UserCountry: userCountry,
	}
	subscriptionServiceInstance := subscription_service.GetSubscriptionServiceInstance()
	subscriptionDetails := subscriptionServiceInstance.GetOrganizationSubscriptionDetails(context.Request().Context(), context.App.Db, context.Session.User.OrganizationId, context.App.Constants.IsCommunityEdition)
	context.SubscriptionDetails = subscriptionDetails
	return context
}

func (ctx *ContextWithSession) IsAiLimitReached() bool {
	quotaInstance := quota_service.GetQuotaServiceInstance(ctx.App.Db)
	return quotaInstance.IsAiLimitReached(ctx.SubscriptionDetails, ctx.Session.User.OrganizationId)
}

func (ctx *ContextWithSession) IsContactCreationLimitReached() bool {
	quotaInstance := quota_service.GetQuotaServiceInstance(ctx.App.Db)
	return quotaInstance.IsContactCreationLimitReached(ctx.Request().Context(), ctx.Session.User.OrganizationId, ctx.App.Db, ctx.SubscriptionDetails)
}

func (ctx *ContextWithSession) IsOrganizationMemberLimitReached() bool {
	quotaInstance := quota_service.GetQuotaServiceInstance(ctx.App.Db)
	return quotaInstance.IsOrganizationMemberLimitReached(ctx.Request().Context(), ctx.Session.User.OrganizationId, ctx.App.Db, ctx.SubscriptionDetails)
}

func (ctx *ContextWithSession) IsActiveCampaignLimitReached() bool {
	quotaInstance := quota_service.GetQuotaServiceInstance(ctx.App.Db)
	return quotaInstance.IsActiveCampaignLimitReached(ctx.Request().Context(), ctx.Session.User.OrganizationId, ctx.App.Db, ctx.SubscriptionDetails)
}

func (ctx *ContextWithSession) CanUseLinkTracking() bool {
	quotaInstance := quota_service.GetQuotaServiceInstance(ctx.App.Db)
	return quotaInstance.CanUseLinkTracking()
}

func (ctx *ContextWithSession) CanAccessApi() bool {
	quotaInstance := quota_service.GetQuotaServiceInstance(ctx.App.Db)
	return quotaInstance.CanAccessApi()
}

func (ctx *ContextWithSession) CanUseLiveTeamInbox() bool {
	quotaInstance := quota_service.GetQuotaServiceInstance(ctx.App.Db)
	return quotaInstance.CanUseLiveTeamInbox()
}
