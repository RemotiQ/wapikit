//go:build managed_cloud
// +build managed_cloud

package main

import (
	"github.com/wapikit/wapikit/api/api_types"
	"github.com/wapikit/wapikit/interfaces"
	"github.com/wapikit/wapikit/services/ai_service"
)

func MountServices(app *interfaces.App) {
	logger := app.Logger
	redis := app.Redis
	db := app.Db

	app.AiService = ai_service.NewAiService(
		&logger,
		redis,
		db,
		koa.String("ai.api_key"),
		api_types.Gpt4o,
		koa.String("ai.azure_endpoint"),
	)
}
