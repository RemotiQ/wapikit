package utils

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	mathRandom "math/rand"
	"mime/multipart"
	"net/http"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/labstack/echo/v4"
	"github.com/nyaruka/phonenumbers"
	binder "github.com/oapi-codegen/runtime"
	"github.com/oklog/ulid"
	"github.com/pariz/gountries"
)

func GenerateUniqueId() string {
	newUlid, err := ulid.New(ulid.Now(), nil)
	if err != nil {
		panic(err)
	}
	return newUlid.String()
}

func ParseUlid(id string) uint64 {
	parsedUlid, err := ulid.Parse(id)
	if err != nil {
		panic(err)
	}

	return parsedUlid.Time()
}

func GenerateOtp(isProduction bool) string {
	if !isProduction {
		return "123456"
	}
	mathRandom.Seed(time.Now().UnixNano())
	min := 100000
	max := 999999
	otp := mathRandom.Intn(max-min+1) + min
	return strconv.Itoa(otp)
}

func BindQueryParams(context echo.Context, dest interface{}) error {
	// Iterate through the fields of the destination struct
	typeOfDest := reflect.TypeOf(dest).Elem()

	valueOfDest := reflect.ValueOf(dest).Elem()
	for i := 0; i < typeOfDest.NumField(); i++ {
		field := typeOfDest.Field(i)
		fieldTag := field.Tag
		structFieldVal := valueOfDest.Field(i)
		// Check if the field has a 'query' tag
		paramName := fieldTag.Get("form")

		if paramName == "" {
			continue
		}

		contactsOmitempty := strings.Contains(paramName, "omitempty")
		// Determine if the parameter is required or optional
		required := !contactsOmitempty
		if contactsOmitempty {
			paramName = strings.Split(paramName, ",")[0]
		}

		// Bind the query parameter to the field
		err := binder.BindQueryParameter("form", true, required, paramName, context.QueryParams(), structFieldVal.Addr().Interface())
		if err != nil {
			return err
		}
	}

	return nil
}

func IsValidEmail(email string) bool {
	pattern := `^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$`
	matched, _ := regexp.MatchString(pattern, email)
	return matched
}

func ParsePhoneNumber(phoneNumber string) (*phonenumbers.PhoneNumber, error) {
	parsedPhoneNumber := phonenumbers.PhoneNumber{}
	err := phonenumbers.ParseAndKeepRawInputToNumber(phoneNumber, "IN", &parsedPhoneNumber)

	if err != nil {
		return nil, err
	}

	return &parsedPhoneNumber, err
}

func EnumExpression(value string) StringExpression {
	return RawString(strings.Join([]string{"'", value, "'"}, ""))
}

type WebhookSecretData struct {
	WhatsappBusinessAccountId string `json:"whatsapp_business_account_id"`
	OrganizationId            string `json:"organization_id"`
}

func GetUserIpFromRequest(r *http.Request) string {
	return r.Header.Get("X-Real-IP")
}

func GetUserCountryFromRequest(r *http.Request) string {
	countryCode := r.Header.Get("CF-IPCountry")
	query := gountries.New()
	country, _ := query.FindCountryByAlpha(countryCode)
	return country.Name.Common
}

func GetCurrentTimeAndDateInUTCString() string {
	return time.Now().UTC().String()
}

func PtrString(s string) *string {
	return &s
}

func CountCSVLines(file multipart.File) (int, error) {
	// Ensure file supports seeking.
	seeker, ok := file.(io.Seeker)
	if !ok {
		fmt.Println("File does not support seeking.")
		// If file is not seekable, we could load into memory (risky for huge files)
		return 0, io.ErrUnexpectedEOF
	}
	// Save current position.
	startPos, err := seeker.Seek(0, io.SeekCurrent)
	if err != nil {
		fmt.Println("Error getting current position:", err)
		return 0, err
	}
	// Reset file to beginning.
	_, err = seeker.Seek(0, io.SeekStart)
	if err != nil {
		fmt.Println("Error seeking to start:", err)
		return 0, err
	}

	scanner := bufio.NewScanner(file)
	// Optionally, adjust the buffer size if you expect very long lines.
	// buf := make([]byte, 0, 64*1024)
	// scanner.Buffer(buf, 1024*1024)

	count := 0
	for scanner.Scan() {
		count++
	}
	if err := scanner.Err(); err != nil {
		fmt.Println("Error scanning file:", err)
		return count, err
	}

	// Reset file pointer to the original position.
	_, err = seeker.Seek(startPos, io.SeekStart)
	if err != nil {
		fmt.Println("Error seeking to original position:", err)
		return count, err
	}

	return count - 1, nil
}

func Contains[T comparable](arr []T, value T) bool {
	for _, v := range arr {
		if v == value {
			return true
		}
	}
	return false
}

func ParseName(fullName string) (string, string) {
	// If the contact name is empty, return empty
	if fullName == "" {
		return "", ""
	}

	// Split on spaces
	parts := strings.Fields(fullName) // "Alice Johnson" -> ["Alice", "Johnson"]

	if len(parts) == 1 {
		// If there's only one word, treat it as firstName
		return parts[0], ""
	}

	// Otherwise, use the first token as firstName, the rest as lastName
	firstName := parts[0]
	lastName := strings.Join(parts[1:], " ")
	return firstName, lastName
}

func ConvertMapToStruct[T any](data map[string]interface{}) (*T, error) {
	b, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}
	var result T
	if err := json.Unmarshal(b, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal data into target struct: %w", err)
	}
	return &result, nil
}

