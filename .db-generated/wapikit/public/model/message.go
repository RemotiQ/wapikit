//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package model

import (
	"github.com/google/uuid"
	"time"
)

type Message struct {
	UniqueId                             uuid.UUID `sql:"primary_key"`
	CreatedAt                            time.Time
	UpdatedAt                            time.Time
	ConversationId                       *uuid.UUID
	CampaignId                           *uuid.UUID
	ContactId                            uuid.UUID
	WhatsappBusinessAccountPhoneNumberId uuid.UUID
	Direction                            MessageDirection
	Content                              string
	Status                               MessageStatus
}
