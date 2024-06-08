// Package handlers provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/deepmap/oapi-codegen version v1.16.3 DO NOT EDIT.
package handlers

// ContactSchema defines model for ContactSchema.
type ContactSchema struct {
	Attributes *map[string]interface{} `json:"attributes,omitempty"`
	CreatedAt  *string                 `json:"created_at,omitempty"`
	Name       *string                 `json:"name,omitempty"`
	Phone      *string                 `json:"phone,omitempty"`
	UniqueId   *int                    `json:"uniqueId,omitempty"`
	UpdatedAt  *string                 `json:"updated_at,omitempty"`
}

// LoginRequestBodySchema defines model for LoginRequestBodySchema.
type LoginRequestBodySchema struct {
	Password string `json:"password"`
	Username string `json:"username"`
}

// LoginResponseBodySchema defines model for LoginResponseBodySchema.
type LoginResponseBodySchema struct {
	Token *string `json:"token,omitempty"`
}

// NewContactSchema defines model for NewContactSchema.
type NewContactSchema struct {
	Attributes *map[string]interface{} `json:"attributes,omitempty"`
	Name       *string                 `json:"name,omitempty"`
	Phone      *string                 `json:"phone,omitempty"`
}

// UpdateContactSchema defines model for UpdateContactSchema.
type UpdateContactSchema struct {
	Attributes *map[string]interface{} `json:"attributes,omitempty"`
	Name       *string                 `json:"name,omitempty"`
	Phone      *string                 `json:"phone,omitempty"`
}

// DeleteSubscriberByListParams defines parameters for DeleteSubscriberByList.
type DeleteSubscriberByListParams struct {
	// Id subscriber id/s to be deleted
	Id string `form:"id" json:"id"`
}

// GetSubscribersParams defines parameters for GetSubscribers.
type GetSubscribersParams struct {
	// Page number of records to skip
	Page *int32 `form:"page,omitempty" json:"page,omitempty"`

	// PerPage max number of records to return per page
	PerPage *int32 `form:"per_page,omitempty" json:"per_page,omitempty"`

	// Query query subscribers with an SQL expression.
	Query *string `form:"query,omitempty" json:"query,omitempty"`
}

// UpdateSubscriberByIdJSONBody defines parameters for UpdateSubscriberById.
type UpdateSubscriberByIdJSONBody struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

// CreateUserJSONBody defines parameters for CreateUser.
type CreateUserJSONBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Username string `json:"username"`
}

// UpdateUserJSONBody defines parameters for UpdateUser.
type UpdateUserJSONBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Username string `json:"username"`
}

// CreateContactJSONRequestBody defines body for CreateContact for application/json ContentType.
type CreateContactJSONRequestBody = NewContactSchema

// UpdateContactByIdJSONRequestBody defines body for UpdateContactById for application/json ContentType.
type UpdateContactByIdJSONRequestBody = UpdateContactSchema

// LoginJSONRequestBody defines body for Login for application/json ContentType.
type LoginJSONRequestBody = LoginRequestBodySchema

// UpdateSubscriberByIdJSONRequestBody defines body for UpdateSubscriberById for application/json ContentType.
type UpdateSubscriberByIdJSONRequestBody UpdateSubscriberByIdJSONBody

// CreateUserJSONRequestBody defines body for CreateUser for application/json ContentType.
type CreateUserJSONRequestBody CreateUserJSONBody

// UpdateUserJSONRequestBody defines body for UpdateUser for application/json ContentType.
type UpdateUserJSONRequestBody UpdateUserJSONBody
