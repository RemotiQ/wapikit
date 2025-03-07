package event_controller

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
	"github.com/vmihailenco/msgpack/v5"
	"github.com/wapikit/wapikit/.db-generated/model"
	table "github.com/wapikit/wapikit/.db-generated/table"
	controller "github.com/wapikit/wapikit/api/controllers"
	"github.com/wapikit/wapikit/interfaces"
)

type EventController struct {
	controller.BaseController `json:"-,inline"`
}

func NewEventController() *EventController {
	return &EventController{
		BaseController: controller.BaseController{
			Name:        "Event Controller",
			RestApiPath: "/api/events",
			Routes: []interfaces.Route{
				{
					Path:                    "/api/events",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithoutSession(handleEventsSubscription),
					IsAuthorizationRequired: false, // this endpoint has its custom authorization logic
				},
			},
		},
	}
}

func handleEventsSubscription(context interfaces.ContextWithoutSession) error {
	logger := context.App.Logger
	eventService := context.App.EventService

	isAuthenticated, userDetails, err := authorizeConnectionRequest(context)
	if !isAuthenticated || err != nil {
		context.Response().WriteHeader(http.StatusUnauthorized)
		fmt.Fprintf(context.Response(), "event: error\ndata: Authorization failed\n\n")
		context.Response().Flush()
		return nil
	}

	context.Response().Header().Set(echo.HeaderContentType, "text/event-stream")
	context.Response().Header().Set(echo.HeaderCacheControl, "no-store")
	context.Response().Header().Set(echo.HeaderConnection, "keep-alive")

	eventChannel := eventService.HandleApiServerEvents(context.Request().Context())

	fmt.Fprintf(context.Response(), "event: connected\ndata: OK\n\n")
	context.Response().Flush()

	for {
		select {
		case event, ok := <-eventChannel:

			if !ok {
				logger.Error("Error reading from event channel")
				context.Response().Flush()
				return nil
			}

			eventType := event.GetEventType()
			data := event.GetData()
			authDetails := event.GetAuthDetails()

			logger.Info("Received event: %s", eventType)
			logger.Info("Event data: %v", data)
			logger.Info("Auth details: %v", authDetails)

			if authDetails == nil {
				logger.Error("Error getting auth details from event")
				continue
			}

			fmt.Println("userDetails.Organization.UniqueId.String()", userDetails.Organization.UniqueId.String())

			if authDetails.OrganizationId != nil {
				// * organization id is defined, so check if the same organization, else if not organizationId means to be sent to every user of that organization
				if *authDetails.OrganizationId != userDetails.Organization.UniqueId.String() {
					// this event is not for this user
					logger.Info("Organization id not matching")
					continue
				}
			}

			if authDetails.UserId != nil {
				// * user id is defined, so check if the same user, else if not userId means to be sent to every user of that organization
				if *authDetails.UserId != userDetails.User.UniqueId.String() {
					logger.Info("User id not matching")
					// this event is not for this user
					continue
				}
			}

			binaryData, err := msgpack.Marshal(data)
			if err != nil {
				logger.Error("Error marshalling event data with MessagePack: %v", err)
				continue
			}
			// Encode the binary data in base64 so it can be sent via SSE
			encoded := base64.StdEncoding.EncodeToString(binaryData)
			fmt.Fprintf(context.Response(), "event: %s\ndata: %s\n\n", eventType, encoded)
			context.Response().Flush()

		case <-context.Request().Context().Done():
			logger.Info("Client disconnected!!")
			return nil
		}
	}
}

type UserWithOrgDetails struct {
	model.User
	Organization struct {
		model.Organization
		OrganizationMember struct {
			model.OrganizationMember
			AssignedRoles []model.RoleAssignment
		}
	}
}

func authorizeConnectionRequest(context interfaces.ContextWithoutSession) (bool, *UserWithOrgDetails, error) {
	token := context.QueryParam("token")

	app := context.App

	parsedPayload, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		secretKey := app.Koa.String("app.jwt_secret")
		if secretKey == "" {
			app.Logger.Error("jwt secret key not configured")
			return "", nil
		}
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			echo.NewHTTPError(echo.ErrUnauthorized.Code, "Unauthorized access")
			return "", nil
		}
		return []byte(app.Koa.String("app.jwt_secret")), nil
	})

	if err != nil {
		return false, nil, nil
	}

	if parsedPayload.Valid {
		castedPayload := parsedPayload.Claims.(jwt.MapClaims)

		email := castedPayload["email"].(string)
		uniqueId := castedPayload["unique_id"].(string)
		organizationId := castedPayload["organization_id"].(string)

		orgUuid := uuid.MustParse(organizationId)

		fmt.Println(email, uniqueId, organizationId)

		if email == "" || uniqueId == "" {
			return false, nil, nil
		}

		var user UserWithOrgDetails

		userQuery := SELECT(
			table.User.AllColumns,
			table.OrganizationMember.AllColumns,
			table.Organization.AllColumns,
			table.RoleAssignment.AllColumns,
		).FROM(
			table.User.
				LEFT_JOIN(table.OrganizationMember, table.User.UniqueId.EQ(table.OrganizationMember.UserId)).
				LEFT_JOIN(table.Organization, table.Organization.UniqueId.EQ(table.OrganizationMember.OrganizationId)).
				LEFT_JOIN(table.RoleAssignment, table.OrganizationMember.UniqueId.EQ(table.RoleAssignment.OrganizationMemberId)),
		).WHERE(
			table.User.Email.EQ(String(email)).AND(
				table.Organization.UniqueId.EQ(UUID(orgUuid)),
			),
		)

		err := userQuery.QueryContext(context.Request().Context(), app.Db, &user)

		if err != nil {
			app.Logger.Error("error fetching user details: %v", err.Error(), nil)
			return false, nil, nil
		}

		if user.User.UniqueId == uuid.Nil {
			return false, nil, errors.New("user not found")
		}
		if user.User.Status != model.UserAccountStatusEnum_Active {
			return false, nil, fmt.Errorf("user account status: %s", user.User.Status)
		}
		if user.Organization.UniqueId == uuid.Nil {
			return false, nil, errors.New("organization not found")
		}

		// ! TODO: fetch the integrations and enabled integration for the users and feed the booleans flags to the context

		if organizationId == "" {
			return false, nil, nil
		}

		return true, &user, nil
	} else {
		return false, nil, nil
	}
}
