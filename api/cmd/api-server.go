package api

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/wapikit/wapikit/interfaces"
)

// initHTTPServer sets up and runs the app's main HTTP server and blocks forever.
func InitHTTPServer(app *interfaces.App) *echo.Echo {
	logger := app.Logger
	koa := app.Koa
	logger.Info("initializing HTTP server")
	var server = echo.New()
	server.HideBanner = true
	server.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("app", app)
			return next(c)
		}
	})

	isFrontendHostedSeparately := app.Koa.Bool("app.is_frontend_separately_hosted")

	if !isFrontendHostedSeparately && app.Constants.IsProduction && app.Constants.IsCommunityEdition {
		// we want to mount the next.js output to "/" , i.e, / -> "index.html" , /about -> "about.html"
		fileServer := app.Fs.FileServer()
		server.GET("/*", echo.WrapHandler(fileServer))
	}

	addMiddlewares(server, app)

	// Mounting all HTTP handlers.
	mountHandlerServices(server, app)

	// getting th server address from config and falling back to localhost:8000
	serverAddress := koa.String("app.address")

	if serverAddress == "" {
		serverAddress = "localhost:8000"
	}

	// Start the server.
	func() {
		logger.Info("starting HTTP server on %s", serverAddress, nil) // Add a placeholder value as the final argument
		if err := server.Start(serverAddress); err != nil {
			if errors.Is(err, http.ErrServerClosed) {
				logger.Info("HTTP server shut down")
			} else {
				logger.Error("error starting HTTP server: %v", err.Error(), nil)
			}
		}
	}()

	return server
}

func addMiddlewares(e *echo.Echo, app *interfaces.App) {
	constants := app.Constants

	// logger middleware
	if constants.IsDebugModeEnabled {
		e.Use(middleware.Logger())
	}

	// compression middleware
	e.Use(middleware.Gzip())

	if constants.IsProduction {
		e.Use(middleware.Recover())
	}

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			origin := c.Request().Header.Get("Origin")
			if origin != "" {
				c.Response().Header().Set("Access-Control-Allow-Origin", origin)
				c.Response().Header().Set("Vary", "Origin")
			}
			c.Response().Header().Set("Access-Control-Allow-Credentials", "true")
			return next(c)
		}
	})

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowCredentials: true,
		AllowHeaders:     []string{echo.HeaderAccept, echo.HeaderAuthorization, echo.HeaderContentType, echo.HeaderOrigin, echo.HeaderCacheControl, "x-access-token", "x-razorpay-signature"},
		ExposeHeaders: []string{
			echo.HeaderContentType,
			"X-RateLimit-Limit",
			"X-RateLimit-Remaining",
			"X-RateLimit-Reset",
		},
		UnsafeWildcardOriginWithAllowCredentials: true,
		AllowMethods:                             []string{http.MethodPost, http.MethodGet, http.MethodHead, http.MethodPut, http.MethodDelete, http.MethodOptions},
		MaxAge:                                   5,
	}))

}
