package interfaces

import (
	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
	"github.com/sarthakjdev/wapikit/internal/api_types"
)

type RateLimitConfig struct {
	MaxRequests    int `json:"maxRequests"`
	WindowTimeInMs int `json:"windowTime"`
}

type RouteMetaData struct {
	PermissionRoleLevel api_types.UserRoleEnum `json:"permissionRoleLevel"`
	RateLimitConfig     RateLimitConfig        `json:"rateLimitConfig"`
}

type Route struct {
	Path                    string `json:"path"`
	Method                  string `json:"method"`
	Handler                 func(context CustomContext) error
	IsAuthorizationRequired bool
	MetaData                RouteMetaData `json:"metaData"`
}

type ApiService interface {
	Register(server *echo.Echo)
	GetServiceName() string
}

type Handler interface {
	Handle(context echo.Context) error
}

type EchoHandler func(context echo.Context) error

func (eh EchoHandler) Handle(context echo.Context) error {
	return eh(context)
}

type CustomHandler func(context CustomContext) error

func (ch CustomHandler) Handle(context echo.Context) error {
	app := context.Get("app").(*App)
	// Check if session is present and is of the expected type
	session, ok := context.Get("Session").(ContextSession)
	if !ok {
		// Session not found or of incorrect type, use an empty session
		session = ContextSession{}
	}

	return ch(CustomContext{
		Context: context,
		App:     *app,
		Session: session,
	})
}

type ContextUser struct {
	Name           string                 `json:"name"`
	UniqueId       string                 `json:"unique_id"`
	Username       string                 `json:"username"`
	Email          string                 `json:"email"`
	Role           api_types.UserRoleEnum `json:"role"`
	OrganizationId string                 `json:"organization_id"`
}

type ContextSession struct {
	Token string      `json:"token"`
	User  ContextUser `json:"user"`
}

type CustomContext struct {
	echo.Context `json:",inline"`
	App          App            `json:"app,omitempty"`
	Session      ContextSession `json:"session,omitempty"`
}

type JwtPayload struct {
	ContextUser        `json:",inline"`
	jwt.StandardClaims `json:",inline"`
}
