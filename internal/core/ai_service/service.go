package ai_service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"

	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/llms/openai"

	"github.com/wapikit/wapikit/.db-generated/model"
	"github.com/wapikit/wapikit/.db-generated/table"
	"github.com/wapikit/wapikit/internal/api_types"
)

type UserQueryIntent string

const (
	UserIntentCampaignInsights    UserQueryIntent = "campaign_insights"
	UserIntentGenerateChatSummary UserQueryIntent = "generate_summary"
)

func FetchRelevantData(intent UserQueryIntent, orgID uuid.UUID, userID uuid.UUID) (json.RawMessage, error) {
	// Query embeddings or database based on intent
	// Example: Fetch last 30 days of campaign insights

	return nil, nil
}

func QueryOpenAi() {
}

func QueryAiModelWithStreaming(ctx context.Context, model api_types.AiModelEnum, input string, contextMessages []api_types.AiChatMessageSchema) (<-chan string, error) {
	streamChannel := make(chan string)
	go func() {
		defer close(streamChannel)

		model := api_types.Gpt35Turbo

		systemPrompt := llms.TextParts(llms.ChatMessageTypeSystem, "You are a AI assistant for a WhatsApp Business Management tool used for sending our marketing campaigns. You will act as a data analyst to provide insights on the data and helps in decision making.")
		userPrompt := llms.TextParts(llms.ChatMessageTypeHuman, input)
		inputPrompt := []llms.MessageContent{
			systemPrompt,
		}
		for _, message := range contextMessages {
			inputPrompt = append(inputPrompt, llms.TextParts(llms.ChatMessageTypeHuman, message.Content))
		}

		inputPrompt = append(inputPrompt, userPrompt)

		switch model {
		case api_types.Gpt35Turbo:
			{
				llm, err := openai.New(
					openai.WithModel("gpt-3.5-turbo"),
					openai.WithToken("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"),
				)
				if err != nil {
					log.Fatal(err)
				}

				resp, err := llm.GenerateContent(ctx,
					inputPrompt,
					llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
						fmt.Printf("Received chunk: %s\n", chunk)
						streamChannel <- string(chunk)
						return nil
					}),
				)

				if err != nil {
					log.Fatal(err)
				}

				rawJson, _ := json.Marshal(resp)

				// ! TODO: get the completion and prompt token from this to update the db with the token count
				// Response: {"Choices":[{"Content":"Of course! WhatsApp marketing involves using the WhatsApp platform to reach out to customers and promote products or services. It can include sending messages, images, videos, and links to customers to engage with them and drive sales. WhatsApp Business is a tool that allows businesses to communicate with their customers more effectively, providing features like automated messages, labels, and statistics to track engagement. It's a powerful tool for businesses to connect with their audience in a more personal and direct way. Let me know if you need more information or have any specific questions!","StopReason":"stop","GenerationInfo":{"CompletionTokens":107,"PromptTokens":135,"TotalTokens":242},"FuncCall":null,"ToolCalls":null}]}
				fmt.Println("Response:", string(rawJson))
			}

		case api_types.Mistral:
			{
				llm, err := ollama.New(ollama.WithModel("mistral"))
				if err != nil {
					log.Fatal(err)
				}

				completion, err := llm.GenerateContent(
					ctx, inputPrompt,
					llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
						fmt.Print(string(chunk))
						streamChannel <- string(chunk)
						return nil
					}))

				if err != nil {
					log.Fatal(err)
				}
				_ = completion
			}

		case api_types.Gpt4o:
			{

			}

		case api_types.GPT4Mini:
			{

			}

		case api_types.Gemini15Pro:
			{

			}

		default:
			log.Println("Unsupported model")
		}
	}()

	return streamChannel, nil
}

func DetectIntent(query string) (UserQueryIntent, error) {
	// keywords := map[UserQueryIntent][]string{
	// 	UserIntentCampaignInsights:    {"campaign", "insights", "last 30 days"},
	// 	UserIntentGenerateChatSummary: {"summary", "chat", "conversation"},
	// }

	return UserIntentCampaignInsights, nil

	// for intent, words := range keywords {
	// 	for _, word := range words {
	// 		if strings.Contains(strings.ToLower(query), word) {
	// 			return intent, nil
	// 		}
	// 	}
	// }
	// return "", fmt.Errorf("intent not detected")
}

func GenerateEmbedding(content string, model api_types.AiModelEnum) ([]float64, error) {
	// Call embedding model and return vector representation
	return nil, nil
}

func LogApiCall(aiChatId uuid.UUID, db *sql.DB, request, response string) error {
	apiLogToInsert := model.AiApiCallLogs{
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		AiChatId:        aiChatId,
		Request:         request,
		Response:        response,
		InputTokenUsed:  0,
		OutputTokenUsed: 0,
	}

	insertQuery := table.AiApiCallLogs.INSERT(
		table.AiApiCallLogs.MutableColumns,
	).MODEL(
		&apiLogToInsert,
	).RETURNING(
		table.AiApiCallLogs.AllColumns,
	)

	_, err := insertQuery.Exec(db)

	if err != nil {
		return err
	}

	return nil
}

func CheckAiRateLimit() bool {
	return false
}

func GetTotalAiTokenConsumedByOrganization(orgUuid uuid.UUID) int {
	return 0
}

func GetTotalAiTokenConsumedByUser(memberUuid uuid.UUID) int {
	return 0
}
