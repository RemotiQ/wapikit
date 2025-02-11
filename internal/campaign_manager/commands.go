package campaign_manager

import (
	"encoding/json"
	"log"
)

type CommandType string

const (
	StopCampaignCommandType CommandType = "stop_campaign"
)

type Command interface {
	GetType() string
	ToJson() []byte
}

type BaseCommand struct {
	CommandType CommandType
}

type StopCampaignCommand struct {
	BaseCommand
	CampaignId string
}

func (c *BaseCommand) GetType() string {
	return string(c.CommandType)
}

func (event BaseCommand) ToJson() []byte {
	bytes, err := json.Marshal(event)
	if err != nil {
		log.Print(err)
	}
	return bytes
}

func NewStopCampaignCommand(campaignId string) *StopCampaignCommand {
	return &StopCampaignCommand{
		BaseCommand: BaseCommand{
			CommandType: StopCampaignCommandType,
		},
		CampaignId: campaignId,
	}
}
