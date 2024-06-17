package next_files_service

import (
	"fmt"
	"net/http"
	"path"

	"github.com/gabriel-vasile/mimetype"
	"github.com/labstack/echo/v4"
	"github.com/sarthakjdev/wapikit/api/services"
	"github.com/sarthakjdev/wapikit/internal/interfaces"
)

type NextFileServerService struct {
	services.BaseService `json:"-,inline"`
}

func NewNextFileServerService() *NextFileServerService {
	fmt.Println("creating new next file server service")
	return &NextFileServerService{
		BaseService: services.BaseService{
			Name:        "Next.js Build Files Service",
			RestApiPath: "/*",
			Routes: []interfaces.Route{
				{
					Path:                    "/_next/*",
					Method:                  http.MethodGet,
					Handler:                 HandleNextStaticJsAndCssRoute,
					IsAuthorizationRequired: false,
				},
				{
					Path:                    "/*",
					Method:                  http.MethodGet,
					Handler:                 ServerHtmlAndNonJsAndCssFiles,
					IsAuthorizationRequired: false,
				},
			},
		},
	}
}

// this handler is for serving the static media files uploaded by user only
func ServerMediaFiles(c interfaces.CustomContext) error {
	app := c.App
	routePath := c.Request().URL.Path
	b, err := app.Fs.Read(routePath)
	if err != nil {
		if err.Error() == "file does not exist" {
			return echo.NewHTTPError(http.StatusNotFound)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.Blob(http.StatusOK, mimetype.Detect(b).String(), b)
}

// this handler is for serving html files and other static file except js and css files
func ServerHtmlAndNonJsAndCssFiles(c interfaces.CustomContext) error {
	app := c.Get("app").(*interfaces.App)
	routePath := c.Request().URL.Path
	fmt.Println("routePath: ", routePath, path.Ext(routePath))
	// check if the request is for some extension other than html or no extension
	requestedFileExt := path.Ext(routePath)
	if routePath != "/" && requestedFileExt != "" && requestedFileExt != ".html" {
		app.Logger.Info("serving static files: %v", routePath, nil)
		b, err := app.Fs.Read(routePath)
		if err != nil {
			app.Logger.Error("error reading static file: %v", err)
			if err.Error() == "file does not exist" {
				_404File, err := app.Fs.Read(path.Join("", "/404.html"))
				if err != nil {
					return echo.NewHTTPError(http.StatusNotFound)
				}

				return c.HTMLBlob(http.StatusOK, _404File)
			}
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.Blob(http.StatusOK, mimetype.Detect(b).String(), b)
	}

	if routePath == "/" {
		app.Logger.Info("serving index.html")
		routePath = "/index"
	}

	b, err := app.Fs.Read(path.Join("", routePath+".html"))
	if err != nil {
		app.Logger.Error("error reading static file in end block: %v", err)

		if err.Error() == "file does not exist" {
			_404File, err := app.Fs.Read(path.Join("", "/404.html"))
			if err != nil {
				return echo.NewHTTPError(http.StatusNotFound)
			}

			return c.HTMLBlob(http.StatusOK, _404File)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.HTMLBlob(http.StatusOK, b)
}

// this handler is for serving js and css files
func HandleNextStaticJsAndCssRoute(c interfaces.CustomContext) error {
	app := c.Get("app").(*interfaces.App)
	b, err := app.Fs.Read(c.Request().URL.Path)

	if err != nil {
		if err.Error() == "file does not exist" {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// check if the file is a js file or css file
	if path.Ext(c.Request().URL.Path) == ".js" {
		return c.Blob(http.StatusOK, "application/javascript", b)
	} else {
		return c.Blob(http.StatusOK, "text/css", b)
	}
}
