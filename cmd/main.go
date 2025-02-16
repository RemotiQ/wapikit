package main

import (
	"log/slog"
	"os"
	"strings"
	"sync"

	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/v2"
	"github.com/knadh/stuffbin"
	api "github.com/wapikit/wapikit/api/cmd"

	"github.com/wapikit/wapikit/interfaces"
	"github.com/wapikit/wapikit/internal/campaign_manager"
	"github.com/wapikit/wapikit/internal/database"
	"github.com/wapikit/wapikit/services/conversation_service"
	"github.com/wapikit/wapikit/services/encryption_service"
	"github.com/wapikit/wapikit/services/event_service"
	cache_service "github.com/wapikit/wapikit/services/redis_service"
)

// because this will be a single binary, we will be providing the flags here
// 1. --install to install the setup the app, but it will be idempotent
// 3. --config to setup the config files
// 4. --version to check the version of the application running
// 5. --help to check the
// 6. --debug to enable the debug mode
// 7. --new-config to generate a new config file
// 8. --yes to assume 'yes' to prompts during --install/upgrade
// 10. --server to start the API server // can run multiple instance, is stateless
// 11. --cm to start the campaign manager // should run only one instance at any point of time

var (
	// Global variables
	logger             = slog.New(slog.NewJSONHandler(os.Stdout, nil))
	koa                = koanf.New(".")
	fs                 stuffbin.FileSystem
	appDir             string = "."
	frontendDir        string = "frontend/out"
	isDebugModeEnabled bool
)

func loadEnvVariables() {
	// load environment variables, configs can also be loaded using the environment variables, using prefix WAPIKIT_
	// for example, WAPIKIT_redis__url is equivalent of redis.url as in config.toml
	if err := koa.Load(env.Provider("WAPIKIT_", ".", func(s string) string {
		return strings.Replace(strings.ToLower(
			strings.TrimPrefix(s, "WAPIKIT_")), "__", ".", -1)
	}), nil); err != nil {
		logger.Error("error loading config from env: %v", err, nil)
	}
}

func generateNewConfigFile() {
	path := koa.Strings("config")[0]
	if err := newConfigFile(path); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	logger.Debug("generated %s. Edit and run --install", path, nil)
	os.Exit(0)
}

func init() {
	initFlags()

	if koa.Bool("version") {
		logger.Info("current version of the application")
	}

	if koa.Bool("debug") {
		isDebugModeEnabled = true
		logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
	}

	if koa.Bool("enterprise") {
		logger.Info("Starting the enterprise edition......")
		loadEnvVariables()
		loadConfigFiles(koa.Strings("config"), koa)
	} else {
		fs = initFS(appDir, "")
		loadConfigFiles(koa.Strings("config"), koa)
		loadEnvVariables()

		// Generate new config.
		if koa.Bool("new-config") {
			generateNewConfigFile()
		}

		if koa.Bool("install") {
			logger.Info("Installing the application")
			installApp(database.GetDbInstance(koa.String("database.url")), fs, !koa.Bool("yes"), koa.Bool("idempotent"))
			os.Exit(0)
		}
	}
}

func main() {
	logger.Info("Starting the application")
	redisUrl := koa.String("redis.url")
	redisPassword := koa.String("redis.password") // this will be defined in case of cloud edition
	if redisUrl == "" {
		logger.Error("Redis URL not provided")
		os.Exit(1)
	}

	constants := initConstants()

	redisClient := cache_service.NewRedisClient(redisUrl, &redisPassword, constants.IsProduction, constants.IsCloudEdition, constants.RedisApiServerEventChannelName, constants.RedisCampaignManagerChannelName)
	dbInstance := database.GetDbInstance(koa.String("database.url"))

	app := &interfaces.App{
		Logger:    *logger,
		Redis:     redisClient,
		Db:        dbInstance,
		Koa:       koa,
		Fs:        fs,
		Constants: constants,
	}

	app.EncryptionService = encryption_service.NewEncryptionService(
		logger,
		koa.String("app.encryption_key"),
	)

	app.ConversationService = conversation_service.NewConversationService(dbInstance, logger, redisClient)
	app.EventService = event_service.NewEventService(dbInstance, logger, redisClient, app.Constants.RedisApiServerEventChannelName)
	app.CampaignManager = campaign_manager.NewCampaignManager(dbInstance, *logger, redisClient, nil, constants.RedisApiServerEventChannelName, constants.RedisCampaignManagerChannelName)

	MountServices(app)

	var wg sync.WaitGroup
	wg.Add(3)

	doStartAPIServer := koa.Bool("server")
	doStartCampaignManager := koa.Bool("cm")

	isSingleBinaryMode := !doStartAPIServer && !doStartCampaignManager

	if isSingleBinaryMode {
		doStartAPIServer = true
		doStartCampaignManager = true
	}

	if doStartCampaignManager {
		// * indefinitely run the campaign manager
		go app.CampaignManager.Run()
	}

	if doStartAPIServer {
		go func() {
			defer wg.Done()
			api.InitHTTPServer(app)
		}()
	}

	wg.Wait()
}
