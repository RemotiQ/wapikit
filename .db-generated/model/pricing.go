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

type Pricing struct {
	UniqueId                  uuid.UUID `sql:"primary_key"`
	CreatedAt                 time.Time
	UpdatedAt                 time.Time
	CurrencyCode              CurrencyCodeEnum
	CurrencySymbol            string
	Country                   CountryEnum
	PriceInLowestCurrencyUnit float64
	PricingPlanId             uuid.UUID
}
