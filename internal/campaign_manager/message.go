package campaign_manager

import (
	"encoding/json"
	"fmt"
	"reflect"
	"time"

	"github.com/wapikit/wapi.go/manager"
	wapiComponents "github.com/wapikit/wapi.go/pkg/components"
	"github.com/wapikit/wapikit/.db-generated/model"
	table "github.com/wapikit/wapikit/.db-generated/table"
	"github.com/wapikit/wapikit/services/notification_service"
	"github.com/wapikit/wapikit/utils"
)

type TemplateParameterInput struct {
	NameOrIndex   string `json:"nameOrIndex"`
	Label         string `json:"label"`
	ParameterType string `json:"parameterType"` // "static" or "dynamic"
	DynamicField  string `json:"dynamicField,omitempty"`
	StaticValue   string `json:"staticValue,omitempty"`
}

type TemplateComponentParameters struct {
	Header  []TemplateParameterInput `json:"header"`
	Body    []TemplateParameterInput `json:"body"`
	Buttons []TemplateParameterInput `json:"buttons"`
}

// For the purposes of these helper functions, we assume that the fetched template’s
// component has these fields. (Adjust as needed.)
type BusinessTemplateComponent struct {
	Type    string
	Format  string
	Example struct {
		BodyText     [][]string
		HeaderText   []string
		HeaderHandle []string
	}
	Buttons []struct {
		Type    string
		Example []string
	}
}

func (cm *CampaignManager) resolveParamValue(
	param TemplateParameterInput,
	contact *model.Contact,
) string {
	if param.ParameterType == "static" {
		if param.StaticValue != "" {
			return param.StaticValue
		}
		return ""
	}

	if param.DynamicField == "" {
		return ""
	}

	first, last := utils.ParseName(contact.Name)

	switch param.DynamicField {
	case "firstName":
		return first
	case "lastName":
		return last
	case "phoneNumber":
		return contact.PhoneNumber
	default:
		return ""
	}
}

// buildTemplateMessage creates a new template message and adds all components.
func (cm *CampaignManager) buildTemplateMessage(templateInUse *manager.WhatsAppBusinessMessageTemplateNode, params TemplateComponentParameters, contact *model.Contact) (*wapiComponents.TemplateMessage, error) {
	cm.Logger.Info("Building template message", nil)
	cm.Logger.Info("Template in use", templateInUse)
	cm.Logger.Info("Template parameters", params)

	templateMessage, err := wapiComponents.NewTemplateMessage(&wapiComponents.TemplateMessageConfigs{
		Name:     templateInUse.Name,
		Language: templateInUse.Language,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating new template message: %v", err)
	}

	for _, comp := range templateInUse.Components {
		switch comp.Type {
		case manager.MessageTemplateComponentTypeBody:
			if err := cm.addBodyComponent(templateMessage, comp, params.Body, contact); err != nil {
				return nil, err
			}
		case manager.MessageTemplateComponentTypeHeader:
			if err := cm.addHeaderComponent(templateMessage, comp, params.Header, contact); err != nil {
				return nil, err
			}
		case manager.MessageTemplateComponentTypeButtons:
			if err := cm.addButtonComponents(templateMessage, comp, params.Buttons, contact); err != nil {
				return nil, err
			}
		default:
			// ignore other types
		}
	}

	cm.Logger.Info("Template message", templateMessage)

	return templateMessage, nil
}

func (cm *CampaignManager) addBodyComponent(
	tmpl *wapiComponents.TemplateMessage,
	comp manager.WhatsAppBusinessHSMWhatsAppHSMComponent,
	bodyParams []TemplateParameterInput,
	contact *model.Contact,
) error {
	var bodyParameters []wapiComponents.TemplateMessageParameter

	if len(comp.Example.BodyText) > 0 {
		for _, param := range bodyParams {
			finalVal := cm.resolveParamValue(param, contact)
			bodyParameters = append(bodyParameters,
				wapiComponents.TemplateMessageBodyAndHeaderParameter{
					Type: wapiComponents.TemplateMessageParameterTypeText,
					Text: &finalVal,
				},
			)
		}
	}

	tmpl.AddBody(wapiComponents.TemplateMessageComponentBodyType{
		Type:       wapiComponents.TemplateMessageComponentTypeBody,
		Parameters: bodyParameters,
	})
	return nil
}

func (cm *CampaignManager) addHeaderComponent(
	tmpl *wapiComponents.TemplateMessage,
	comp manager.WhatsAppBusinessHSMWhatsAppHSMComponent,
	headerParams []TemplateParameterInput,
	contact *model.Contact,
) error {
	// If no placeholders, just add an empty header
	if len(comp.Example.HeaderText) == 0 && len(comp.Example.HeaderHandle) == 0 {
		tmpl.AddHeader(wapiComponents.TemplateMessageComponentHeaderType{
			Type: wapiComponents.TemplateMessageComponentTypeHeader,
		})
		return nil
	}

	switch comp.Format {
	case "TEXT":
		var headerParameters []wapiComponents.TemplateMessageParameter
		for _, param := range headerParams {
			finalVal := cm.resolveParamValue(param, contact)
			headerParameters = append(headerParameters,
				wapiComponents.TemplateMessageBodyAndHeaderParameter{
					Type: wapiComponents.TemplateMessageParameterTypeText,
					Text: &finalVal,
				},
			)
		}
		tmpl.AddHeader(wapiComponents.TemplateMessageComponentHeaderType{
			Type:       wapiComponents.TemplateMessageComponentTypeHeader,
			Parameters: &headerParameters,
		})

	case "IMAGE":
		// Expect each param to be a link
		var headerParameters []wapiComponents.TemplateMessageParameter
		for _, param := range headerParams {
			link := cm.resolveParamValue(param, contact)
			headerParameters = append(headerParameters,
				wapiComponents.TemplateMessageBodyAndHeaderParameter{
					Type: wapiComponents.TemplateMessageParameterTypeImage,
					Image: &wapiComponents.TemplateMessageParameterMedia{
						Link: link,
					},
				},
			)
		}
		tmpl.AddHeader(wapiComponents.TemplateMessageComponentHeaderType{
			Type:       wapiComponents.TemplateMessageComponentTypeHeader,
			Parameters: &headerParameters,
		})

	case "VIDEO":
		// Similar approach for video link
		var headerParameters []wapiComponents.TemplateMessageParameter
		for _, param := range headerParams {
			link := cm.resolveParamValue(param, contact)
			headerParameters = append(headerParameters,
				wapiComponents.TemplateMessageBodyAndHeaderParameter{
					Type: wapiComponents.TemplateMessageParameterTypeVideo,
					Video: &wapiComponents.TemplateMessageParameterMedia{
						Link: link,
					},
				},
			)
		}
		tmpl.AddHeader(wapiComponents.TemplateMessageComponentHeaderType{
			Type:       wapiComponents.TemplateMessageComponentTypeHeader,
			Parameters: &headerParameters,
		})

	case "DOCUMENT":
		var headerParameters []wapiComponents.TemplateMessageParameter
		for _, param := range headerParams {
			link := cm.resolveParamValue(param, contact)
			headerParameters = append(headerParameters,
				wapiComponents.TemplateMessageBodyAndHeaderParameter{
					Type: wapiComponents.TemplateMessageParameterTypeDocument,
					Document: &wapiComponents.TemplateMessageParameterMedia{
						Link: link,
					},
				},
			)
		}
		tmpl.AddHeader(wapiComponents.TemplateMessageComponentHeaderType{
			Type:       wapiComponents.TemplateMessageComponentTypeHeader,
			Parameters: &headerParameters,
		})

	case "LOCATION":
		// If there's a dynamic param, it might be a JSON containing lat/long
		if len(headerParams) == 0 {
			return fmt.Errorf("no location parameter provided in header")
		}
		firstVal := cm.resolveParamValue(headerParams[0], contact)
		var loc wapiComponents.TemplateMessageParameterLocation
		if err := json.Unmarshal([]byte(firstVal), &loc); err != nil {
			return fmt.Errorf("error unmarshalling location JSON: %v", err)
		}
		headerParameters := []wapiComponents.TemplateMessageParameter{
			wapiComponents.TemplateMessageBodyAndHeaderParameter{
				Type:     wapiComponents.TemplateMessageParameterTypeLocation,
				Location: &loc,
			},
		}
		tmpl.AddHeader(wapiComponents.TemplateMessageComponentHeaderType{
			Type:       wapiComponents.TemplateMessageComponentTypeHeader,
			Parameters: &headerParameters,
		})
	default:
		return fmt.Errorf("unsupported header format: %s", comp.Format)
	}

	return nil
}

func (cm *CampaignManager) addButtonComponents(
	tmpl *wapiComponents.TemplateMessage,
	comp manager.WhatsAppBusinessHSMWhatsAppHSMComponent,
	buttonParams []TemplateParameterInput,
	contact *model.Contact,
) error {
	for index, btn := range comp.Buttons {
		switch btn.Type {
		case manager.TemplateMessageButtonTypeUrl:
			// Expect a param at index for the URL payload
			if index < len(buttonParams) {
				finalVal := cm.resolveParamValue(buttonParams[index], contact)
				tmpl.AddButton(wapiComponents.TemplateMessageComponentButtonType{
					Type:    wapiComponents.TemplateMessageComponentTypeButton,
					SubType: wapiComponents.TemplateMessageButtonComponentTypeUrl,
					Index:   index,
					Parameters: &[]wapiComponents.TemplateMessageParameter{
						wapiComponents.TemplateMessageButtonParameter{
							Type: wapiComponents.TemplateMessageButtonParameterTypeText,
							Text: finalVal,
						},
					},
				})
			}
		case manager.TemplateMessageButtonTypeQuickReply:
			if index < len(buttonParams) {
				finalVal := cm.resolveParamValue(buttonParams[index], contact)
				tmpl.AddButton(wapiComponents.TemplateMessageComponentButtonType{
					Type:    wapiComponents.TemplateMessageComponentTypeButton,
					SubType: wapiComponents.TemplateMessageButtonComponentTypeQuickReply,
					Index:   index,
					Parameters: &[]wapiComponents.TemplateMessageParameter{
						wapiComponents.TemplateMessageButtonParameter{
							Type:    wapiComponents.TemplateMessageButtonParameterTypePayload,
							Payload: finalVal,
						},
					},
				})
			}
		case manager.TemplateMessageButtonTypePhoneNumber:
			// If you have a phone number button type
			// Similar approach: finalVal = cm.resolveParamValue(...)

		case manager.TemplateMessageButtonTypeCopyCode:
			// If you have a custom "copy code" type
			// finalVal = cm.resolveParamValue(...)
			// etc.

		default:
			// log or ignore
		}
	}
	return nil
}

// --- Main sendMessage function ---

func (cm *CampaignManager) sendMessage(message *CampaignMessage) error {
	// Ensure that the campaign wait group is decremented and update the last contact ID,
	// irrespective of whether sending succeeds.
	defer func() {
		message.Campaign.wg.Done()
		if err := cm.UpdateLastContactId(message.Campaign.UniqueId, message.Contact.UniqueId); err != nil {
			cm.Logger.Error("error updating last contact id", "error", err.Error())
		}
	}()

	// Retrieve the business worker.
	cm.businessWorkersMutex.RLock()
	worker, exists := cm.businessWorkers[message.Campaign.BusinessAccountId]
	cm.businessWorkersMutex.RUnlock()
	if !exists {
		cm.Logger.Error("Business worker not found", nil)
		cm.NotificationService.SendSlackNotification(notification_service.SlackNotificationParams{
			Title:   "🚨🚨 Business worker not found in send message 🚨🚨",
			Message: "Business worker not found for business account ID: " + message.Campaign.BusinessAccountId,
		})
		return fmt.Errorf("business worker not found for business account ID: %s", message.Campaign.BusinessAccountId)
	}

	// Fetch the template details.
	client := message.Campaign.WapiClient
	templateInUse, err := client.Business.Template.Fetch(*message.Campaign.MessageTemplateId)
	if err != nil {
		message.Campaign.ErrorCount.Add(1)
		return fmt.Errorf("error fetching template: %v", err)
	}

	// Determine if the template requires parameters.
	doTemplateRequireParameter := false
	for _, comp := range templateInUse.Components {
		if len(comp.Example.BodyText) > 0 || len(comp.Example.HeaderText) > 0 || len(comp.Example.HeaderHandle) > 0 {
			doTemplateRequireParameter = true
		}
		if len(comp.Buttons) > 0 {
			for _, btn := range comp.Buttons {
				if len(btn.Example) > 0 {
					doTemplateRequireParameter = true
				}
			}
		}
	}

	var params TemplateComponentParameters
	err = json.Unmarshal([]byte(*message.Campaign.TemplateMessageComponentParameters), &params)
	if err != nil {
		return fmt.Errorf("error unmarshalling template parameters: %v", err)
	}

	if doTemplateRequireParameter && reflect.DeepEqual(params, TemplateComponentParameters{}) {
		cm.StopCampaign(message.Campaign.UniqueId.String())
		return fmt.Errorf("template requires parameters, but no parameter found in the database")
	}

	// Build the template message using our helper functions.
	templateMessage, err := cm.buildTemplateMessage(templateInUse, params, &message.Contact)
	if err != nil {
		return fmt.Errorf("error building template message: %v", err)
	}

	// Send the message using the messaging client.
	messagingClient := client.NewMessagingClient(message.Campaign.PhoneNumberToUse)
	response, err := messagingClient.Message.Send(templateMessage, message.Contact.PhoneNumber)

	cm.Logger.Info("Message send response", response)

	messageStatus := model.MessageStatusEnum_Sent
	if err != nil {
		cm.Logger.Error("error sending message to user", err.Error())
		message.Campaign.ErrorCount.Add(1)
		messageStatus = model.MessageStatusEnum_Failed
		return err
	}

	// Convert the sent message to JSON for record keeping.
	jsonMessage, err := templateMessage.ToJson(wapiComponents.ApiCompatibleJsonConverterConfigs{
		SendToPhoneNumber: message.Contact.PhoneNumber,
	})
	if err != nil {
		return err
	}
	stringifiedJsonMessage := string(jsonMessage)

	// Save a record of the sent message to the database.
	messageSent := model.Message{
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		CampaignId:      &message.Campaign.UniqueId,
		Direction:       model.MessageDirectionEnum_OutBound,
		ContactId:       message.Contact.UniqueId,
		PhoneNumberUsed: message.Campaign.PhoneNumberToUse,
		OrganizationId:  message.Campaign.OrganizationId,
		MessageData:     &stringifiedJsonMessage,
		MessageType:     model.MessageTypeEnum_Template,
		Status:          messageStatus,
	}

	messageSentRecordQuery := table.Message.
		INSERT(table.Message.MutableColumns).
		MODEL(messageSent).
		RETURNING(table.Message.AllColumns)

	if err = messageSentRecordQuery.Query(cm.Db, &messageSent); err != nil {
		cm.Logger.Error("error saving message record to the database", err.Error())
	}

	// Update rate limiter and campaign counters.
	worker.rateLimiter.Incr(1)
	message.Campaign.Sent.Add(1)
	return nil
}
