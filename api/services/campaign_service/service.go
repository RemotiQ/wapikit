package campaign_service

import (
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/sarthakjdev/wapikit/api/services"
	"github.com/sarthakjdev/wapikit/internal/api_types"
	"github.com/sarthakjdev/wapikit/internal/core/utils"
	"github.com/sarthakjdev/wapikit/internal/database"
	"github.com/sarthakjdev/wapikit/internal/interfaces"

	. "github.com/go-jet/jet/v2/postgres"
	"github.com/sarthakjdev/wapikit/.db-generated/model"
	table "github.com/sarthakjdev/wapikit/.db-generated/table"
)

type CampaignService struct {
	services.BaseService `json:"-,inline"`
}

func NewCampaignService() *CampaignService {
	return &CampaignService{
		BaseService: services.BaseService{
			Name:        "Campaign Service",
			RestApiPath: "/api/campaign",
			Routes: []interfaces.Route{
				{
					Path:                    "/api/campaigns",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(getCampaigns),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    10,
							WindowTimeInMs: 1000 * 60 * 60, // 1 hour
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetCampaign,
						},
					},
				},
				{
					Path:                    "/api/campaigns",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(createNewCampaign),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    10,
							WindowTimeInMs: 1000 * 60 * 60, // 1 hour
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.CreateCampaign,
						},
					},
				},
				{
					Path:                    "/api/campaigns/:id",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(getCampaignById),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    10,
							WindowTimeInMs: 1000 * 60 * 60, // 1 hour
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetCampaign,
						},
					},
				},
				{
					Path:                    "/api/campaigns/:id",
					Method:                  http.MethodPost,
					Handler:                 interfaces.HandlerWithSession(updateCampaignById),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    10,
							WindowTimeInMs: 1000 * 60 * 60, // 1 hour
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.UpdateCampaign,
						},
					},
				},
				{
					Path:                    "/api/campaigns/:id",
					Method:                  http.MethodDelete,
					Handler:                 interfaces.HandlerWithSession(deleteCampaignById),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RateLimitConfig: interfaces.RateLimitConfig{
							MaxRequests:    10,
							WindowTimeInMs: 1000 * 60 * 60, // 1 hour
						},
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.DeleteCampaign,
						},
					},
				},
			},
		},
	}
}

func getCampaigns(context interfaces.ContextWithSession) error {

	params := new(api_types.GetCampaignsParams)

	err := utils.BindQueryParams(context, params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	pageNumber := params.Page
	pageSize := params.PerPage
	order := params.Order
	status := params.Status

	var dest []struct {
		TotalCampaigns int `json:"totalCampaigns"`
		model.Campaign
		Tags []struct {
			model.Tag
		}
		Lists []struct {
			model.ContactList
		}
	}

	orgUuid, _ := uuid.Parse(context.Session.User.OrganizationId)

	whereCondition := table.Campaign.OrganizationId.EQ(UUID(orgUuid))

	campaignQuery := SELECT(
		table.Campaign.AllColumns,
		table.Tag.AllColumns,
		table.CampaignList.AllColumns,
		table.CampaignList.AllColumns,
		table.CampaignTag.AllColumns,
		COUNT(table.Campaign.UniqueId).OVER().AS("totalCampaigns"),
	).
		FROM(table.Campaign.
			LEFT_JOIN(table.CampaignTag, table.CampaignTag.CampaignId.EQ(table.Campaign.UniqueId)).
			LEFT_JOIN(table.Tag, table.Tag.UniqueId.EQ(table.CampaignTag.TagId)).
			LEFT_JOIN(table.CampaignList, table.CampaignList.CampaignId.EQ(table.Campaign.UniqueId)).
			LEFT_JOIN(table.ContactList, table.ContactList.UniqueId.EQ(table.CampaignList.ContactListId)),
		).
		WHERE(whereCondition).
		LIMIT(pageSize).
		OFFSET((pageNumber - 1) * pageSize)

	if order != nil {
		if *order == api_types.OrderEnum(api_types.Asc) {
			campaignQuery.ORDER_BY(table.Campaign.CreatedAt.ASC())
		} else {
			campaignQuery.ORDER_BY(table.Campaign.CreatedAt.DESC())
		}
	}

	if status != nil {
		statusToFilterWith := model.CampaignStatus(*status)
		whereCondition.AND(table.Campaign.Status.EQ(String(statusToFilterWith.String())))
	}

	err = campaignQuery.QueryContext(context.Request().Context(), context.App.Db, &dest)

	if err != nil {
		if err.Error() == "qrm: no rows in result set" {
			total := 0
			campaigns := make([]api_types.CampaignSchema, 0)
			return context.JSON(http.StatusOK, api_types.GetCampaignResponseSchema{
				Campaigns: campaigns,
				PaginationMeta: api_types.PaginationMeta{
					Page:    pageNumber,
					PerPage: pageSize,
					Total:   total,
				},
			})
		} else {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())

		}
	}

	campaignsToReturn := []api_types.CampaignSchema{}

	if len(dest) > 0 {
		for _, campaign := range dest {
			tags := []api_types.TagSchema{}
			lists := []api_types.ContactListSchema{}
			status := api_types.CampaignStatusEnum(campaign.Status)
			var isLinkTrackingEnabled bool

			if len(campaign.Tags) > 0 {
				for _, tag := range campaign.Tags {
					stringUniqueId := tag.UniqueId.String()
					tagToAppend := api_types.TagSchema{
						UniqueId: stringUniqueId,
						Name:     tag.Label,
					}

					tags = append(tags, tagToAppend)
				}
			}

			if len(campaign.Lists) > 0 {
				for _, list := range campaign.Lists {
					stringUniqueId := list.UniqueId.String()
					listToAppend := api_types.ContactListSchema{
						UniqueId: stringUniqueId,
						Name:     list.Name,
					}

					lists = append(lists, listToAppend)
				}
			}

			cmpgn := api_types.CampaignSchema{
				CreatedAt:             campaign.CreatedAt,
				Name:                  campaign.Name,
				Description:           &campaign.Name,
				IsLinkTrackingEnabled: isLinkTrackingEnabled, // ! TODO: db field check
				TemplateMessageId:     campaign.MessageTemplateId,
				Status:                status,
				Lists:                 lists,
				Tags:                  tags,
				SentAt:                nil,
				UniqueId:              campaign.UniqueId.String(),
			}
			campaignsToReturn = append(campaignsToReturn, cmpgn)
		}
	}

	totalCampaigns := 0

	if len(dest) > 0 {
		totalCampaigns = dest[0].TotalCampaigns
	}

	return context.JSON(http.StatusOK, api_types.GetCampaignResponseSchema{
		Campaigns: campaignsToReturn,
		PaginationMeta: api_types.PaginationMeta{
			Page:    pageNumber,
			PerPage: pageSize,
			Total:   totalCampaigns,
		},
	})
}

func createNewCampaign(context interfaces.ContextWithSession) error {
	payload := new(api_types.CreateCampaignJSONRequestBody)
	if err := context.Bind(payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// create new campaign
	organizationUuid, err := uuid.Parse(context.Session.User.OrganizationId)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	userUuid, err := uuid.Parse(context.Session.User.UniqueId)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	orgMemberQuery := SELECT(table.OrganizationMember.AllColumns).
		FROM(table.OrganizationMember).
		WHERE(table.OrganizationMember.UserId.EQ(UUID(userUuid)).AND(
			table.OrganizationMember.OrganizationId.EQ(UUID(organizationUuid)),
		)).LIMIT(1)

	var orgMember model.OrganizationMember

	err = orgMemberQuery.QueryContext(context.Request().Context(), context.App.Db, &orgMember)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var newCampaign model.Campaign
	tx, err := context.App.Db.BeginTx(context.Request().Context(), nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer tx.Rollback()
	// 1. Insert Campaign
	err = table.Campaign.INSERT(table.Campaign.MutableColumns).MODEL(model.Campaign{
		Name:                          payload.Name,
		Status:                        model.CampaignStatus_Draft,
		OrganizationId:                organizationUuid,
		MessageTemplateId:             &payload.TemplateMessageId,
		PhoneNumber:                   payload.PhoneNumberToUse,
		IsLinkTrackingEnabled:         payload.IsLinkTrackingEnabled,
		CreatedByOrganizationMemberId: orgMember.UniqueId,
		CreatedAt:                     time.Now(),
		UpdatedAt:                     time.Now(),
	}).RETURNING(table.Campaign.AllColumns).QueryContext(context.Request().Context(), tx, &newCampaign)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// 2. Insert Campaign Tags (if any)
	if len(payload.Tags) > 0 {
		var campaignTags []model.CampaignTag
		for _, payloadTag := range payload.Tags {
			tagUUID, err := uuid.Parse(payloadTag)
			if err != nil {
				context.App.Logger.Error("Error converting tag unique id to uuid: %v", err)
				continue
			}
			campaignTags = append(campaignTags, model.CampaignTag{
				CampaignId: newCampaign.UniqueId, // Use the inserted campaign ID
				TagId:      tagUUID,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			})
		}

		_, err := table.CampaignTag.INSERT(table.CampaignTag.MutableColumns).
			MODELS(campaignTags).ExecContext(context.Request().Context(), tx)

		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	}

	fmt.Println("Payload List Ids: ", payload.ListIds)

	var campaignList []model.CampaignList

	// 3. Insert Campaign Lists (if any)
	if len(payload.ListIds) > 0 {
		campaignLists := make([]model.CampaignList, 0)
		for _, listId := range payload.ListIds {
			listUUID, err := uuid.Parse(listId)
			fmt.Println("List UUID: ", listUUID)
			if err != nil {
				context.App.Logger.Error("Error converting list unique id to uuid: %v", err)
				continue
			}
			campaignLists = append(campaignLists, model.CampaignList{
				CampaignId:    newCampaign.UniqueId, // Use the inserted campaign ID
				ContactListId: listUUID,
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			})
		}

		campaignListQuery := table.CampaignList.INSERT().
			MODELS(campaignLists).
			RETURNING(table.CampaignList.AllColumns)

		err = campaignListQuery.QueryContext(context.Request().Context(), tx, &campaignList)

		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	}

	err = tx.Commit()

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	responseToReturn := api_types.CreateNewCampaignResponseSchema{
		Campaign: api_types.CampaignSchema{
			CreatedAt:             newCampaign.CreatedAt,
			UniqueId:              newCampaign.UniqueId.String(),
			Name:                  newCampaign.Name,
			Description:           &newCampaign.Name,
			IsLinkTrackingEnabled: newCampaign.IsLinkTrackingEnabled,
			TemplateMessageId:     newCampaign.MessageTemplateId,
			Status:                api_types.CampaignStatusEnum(newCampaign.Status),
			Lists:                 []api_types.ContactListSchema{},
			Tags:                  []api_types.TagSchema{},
			SentAt:                nil,
		},
	}

	return context.JSON(http.StatusOK, responseToReturn)
}

func getCampaignById(context interfaces.ContextWithSession) error {
	campaignId := context.Param("id")
	if campaignId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Campaign Id")
	}

	campaignUuid, _ := uuid.Parse(campaignId)

	sqlStatement := SELECT(table.Campaign.AllColumns, table.Tag.AllColumns, table.ContactList.AllColumns).
		FROM(table.Campaign.
			LEFT_JOIN(table.CampaignTag, table.CampaignTag.CampaignId.EQ(UUID(campaignUuid))).
			LEFT_JOIN(table.Tag, table.Tag.UniqueId.EQ(table.CampaignTag.TagId)).
			LEFT_JOIN(table.CampaignList, table.CampaignList.CampaignId.EQ(UUID(campaignUuid))).
			LEFT_JOIN(table.ContactList, table.ContactList.UniqueId.EQ(table.CampaignList.ContactListId))).
		WHERE(
			table.Campaign.UniqueId.EQ(UUID(campaignUuid)),
		).LIMIT(1)

	var campaignResponse struct {
		model.Campaign
		Tags  []model.Tag
		Lists []model.ContactList
	}

	sqlStatement.Query(database.GetDbInstance(), &campaignResponse)

	if campaignResponse.UniqueId.String() == "" {
		return echo.NewHTTPError(http.StatusNotFound, "Campaign not found")
	}

	status := api_types.CampaignStatusEnum(campaignResponse.Status)
	isLinkTrackingEnabled := false // ! TODO: db field check

	stringUniqueId := campaignResponse.UniqueId.String()

	return context.JSON(http.StatusOK, api_types.GetCampaignByIdResponseSchema{
		Campaign: api_types.CampaignSchema{
			CreatedAt:             campaignResponse.CreatedAt,
			UniqueId:              stringUniqueId,
			Name:                  campaignResponse.Name,
			Description:           &campaignResponse.Name,
			IsLinkTrackingEnabled: isLinkTrackingEnabled, // ! TODO: db field check
			TemplateMessageId:     campaignResponse.MessageTemplateId,
			PhoneNumberInUse:      &campaignResponse.PhoneNumber,
			Status:                status,
			Lists:                 []api_types.ContactListSchema{},
			Tags:                  []api_types.TagSchema{},
			SentAt:                nil,
		},
	})
}

func updateCampaignById(context interfaces.ContextWithSession) error {
	campaignId := context.Param("id")
	if campaignId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Campaign Id")
	}
	payload := new(api_types.UpdateCampaignByIdJSONRequestBody)
	if err := context.Bind(payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	fmt.Println("Payload: ", payload)

	orgUuid, _ := uuid.Parse(context.Session.User.OrganizationId)
	campaignUuid, _ := uuid.Parse(campaignId)

	var campaign struct {
		model.Campaign
		Tags  []model.Tag
		Lists []model.ContactList
	}

	campaignQuery := SELECT(table.Campaign.AllColumns, table.Tag.AllColumns, table.ContactList.AllColumns).
		FROM(table.Campaign.
			LEFT_JOIN(table.CampaignTag, table.CampaignTag.CampaignId.EQ(UUID(campaignUuid))).
			LEFT_JOIN(table.Tag, table.Tag.UniqueId.EQ(table.CampaignTag.TagId)).
			LEFT_JOIN(table.CampaignList, table.CampaignList.CampaignId.EQ(UUID(campaignUuid))).
			LEFT_JOIN(table.ContactList, table.ContactList.UniqueId.EQ(table.CampaignList.ContactListId))).
		WHERE(
			table.Campaign.OrganizationId.EQ(UUID(orgUuid)).AND(
				table.Campaign.UniqueId.EQ(UUID(campaignUuid)),
			),
		).LIMIT(1)

	err := campaignQuery.QueryContext(context.Request().Context(), context.App.Db, &campaign)

	if err != nil {
		if err.Error() == "qrm: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "Campaign not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	fmt.Println("Campaign: ", campaign)

	// ! if this is a status update, handle it first and return
	if campaign.Status != model.CampaignStatus(*payload.Status) {
		// * this is a status update

		updateStatusQuery :=
			table.Campaign.UPDATE(table.Campaign.Status).
				WHERE(table.Campaign.UniqueId.EQ(UUID(campaignUuid)))

		if *payload.Status == api_types.Finished {
			return echo.NewHTTPError(http.StatusBadRequest, "user can not finish a campaign, but can cancel it.")
		}

		if *payload.Status == api_types.Running {
			updateStatusQuery.SET(table.Campaign.Status.SET(utils.EnumExpression(model.CampaignStatus_Running.String())))
			_, err := updateStatusQuery.ExecContext(context.Request().Context(), context.App.Db)
			if err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
			}

		} else if *payload.Status == api_types.Paused || *payload.Status == api_types.Cancelled {
			if campaign.Status != model.CampaignStatus_Running {
				return echo.NewHTTPError(http.StatusBadRequest, "Cannot pause a campaign that is not running")
			}

			updateStatusQuery.SET(table.Campaign.Status.SET(utils.EnumExpression(model.CampaignStatus_Paused.String())))
			_, err := updateStatusQuery.ExecContext(context.Request().Context(), context.App.Db)
			if err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
			}

			context.App.CampaignManager.StopCampaign(campaign.UniqueId.String())
		}

		return context.JSON(http.StatusOK, api_types.UpdateCampaignByIdResponseSchema{
			IsUpdated: true,
		})
	}

	if campaign.Status == model.CampaignStatus_Finished || campaign.Status == model.CampaignStatus_Cancelled {
		return echo.NewHTTPError(http.StatusBadRequest, "Cannot update a finished campaign")
	}

	if campaign.Status == model.CampaignStatus_Running {
		return echo.NewHTTPError(http.StatusBadRequest, "Cannot update a running campaign, pause the campaign first to update")
	}

	if len(campaign.Tags) > 0 && len(payload.Tags) >= 0 {
		tagIdsExpressions := make([]Expression, len(payload.Tags))
		var tagsToUpsert []model.CampaignTag
		for i, tagId := range payload.Tags {
			tagUuid, err := uuid.Parse(tagId)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, "Invalid Tag Id")
			}
			tagIdsExpressions[i] = UUID(tagUuid)
			tagsToUpsert = append(tagsToUpsert, model.CampaignTag{
				CampaignId: campaign.UniqueId,
				TagId:      tagUuid,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			})
		}

		removedTagCte := CTE("removed_tags")
		insertedTagCte := CTE("inserted_tags")
		var tags []model.Tag

		tagsSyncQuery := WITH_RECURSIVE(removedTagCte.AS(
			table.CampaignTag.DELETE().
				WHERE(table.CampaignTag.CampaignId.EQ(UUID(campaignUuid)).
					AND(table.CampaignTag.TagId.NOT_IN(tagIdsExpressions...))).
				RETURNING(table.CampaignTag.AllColumns),
		), insertedTagCte.AS(table.CampaignTag.INSERT(table.CampaignTag.MutableColumns).
			MODELS(tagsToUpsert).
			RETURNING(table.CampaignTag.AllColumns).
			ON_CONFLICT(table.CampaignTag.CampaignId, table.CampaignTag.TagId).
			DO_NOTHING()))(
			SELECT(table.Tag.AllColumns).
				FROM(table.Tag).
				WHERE(table.Tag.UniqueId.IN(tagIdsExpressions...).
					AND(table.Tag.OrganizationId.EQ(UUID(orgUuid)))),
		)

		err = tagsSyncQuery.QueryContext(context.Request().Context(), context.App.Db, &tags)

		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	}

	if len(campaign.Lists) != 0 && len(payload.ListIds) != 0 {
		removedListCte := CTE("removed_lists")
		insertedListCte := CTE("inserted_lists")

		listIdsExpressions := make([]Expression, len(payload.ListIds))
		listsToUpsert := make([]model.CampaignList, len(payload.ListIds))

		for i, listId := range payload.ListIds {
			listUuid, err := uuid.Parse(listId)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, "Invalid List Id")
			}
			listIdsExpressions[i] = UUID(listUuid)
			listsToUpsert = append(listsToUpsert, model.CampaignList{
				CampaignId:    campaign.UniqueId,
				ContactListId: listUuid,
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			})
		}

		var contactLists []model.ContactList

		listsSyncQuery := WITH_RECURSIVE(removedListCte.AS(
			table.CampaignList.DELETE().
				WHERE(table.CampaignList.CampaignId.EQ(UUID(campaignUuid)).
					AND(table.CampaignList.ContactListId.NOT_IN(listIdsExpressions...))).
				RETURNING(table.CampaignList.AllColumns),
		), insertedListCte.AS(
			table.CampaignList.INSERT(table.CampaignList.MutableColumns).
				MODELS(listsToUpsert).
				RETURNING(table.CampaignList.AllColumns).
				ON_CONFLICT(table.CampaignList.CampaignId, table.CampaignList.ContactListId).
				DO_NOTHING(),
		))(
			SELECT(table.ContactList.AllColumns).
				FROM(table.ContactList).
				WHERE(table.ContactList.UniqueId.IN(listIdsExpressions...).
					AND(table.ContactList.OrganizationId.EQ(UUID(orgUuid)))),
		)

		err = listsSyncQuery.QueryContext(context.Request().Context(), context.App.Db, &contactLists)

		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

	}

	campaignUpdateQuery := table.Campaign.UPDATE(table.Campaign.MutableColumns).
		MODEL(model.Campaign{
			Name:                          payload.Name,
			MessageTemplateId:             payload.TemplateMessageId,
			PhoneNumber:                   *payload.PhoneNumber,
			IsLinkTrackingEnabled:         payload.EnableLinkTracking,
			UpdatedAt:                     time.Now(),
			Status:                        model.CampaignStatus(*payload.Status),
			OrganizationId:                orgUuid,
			CreatedByOrganizationMemberId: campaign.CreatedByOrganizationMemberId,
		}).
		WHERE(table.Campaign.UniqueId.EQ(UUID(campaignUuid))).
		RETURNING(table.Campaign.AllColumns)

	var updatedCampaign model.Campaign

	err = campaignUpdateQuery.QueryContext(context.Request().Context(), context.App.Db, &updatedCampaign)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	response := api_types.UpdateCampaignByIdResponseSchema{
		IsUpdated: true,
	}

	return context.JSON(http.StatusOK, response)
}

func deleteCampaignById(context interfaces.ContextWithSession) error {
	campaignId := context.Param("id")
	if campaignId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Campaign Id")
	}

	orgUuid, _ := uuid.Parse(context.Session.User.OrganizationId)
	campaignUuid, _ := uuid.Parse(campaignId)
	var campaign model.Campaign
	campaignQuery := SELECT(table.Campaign.AllColumns).FROM(table.Campaign).
		WHERE(
			table.Campaign.UniqueId.EQ(UUID(campaignUuid)).
				AND(table.Campaign.OrganizationId.EQ(UUID(orgUuid))))
	err := campaignQuery.QueryContext(context.Request().Context(), context.App.Db, &campaign)

	if err != nil {
		if err.Error() == "qrm: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "Campaign not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if campaign.Status == model.CampaignStatus_Running {
		return echo.NewHTTPError(http.StatusBadRequest, "Cannot delete a running campaign, pause the campaign first to delete")
	}

	result, err := table.Campaign.DELETE().WHERE(table.Campaign.UniqueId.EQ(String(campaignId))).ExecContext(context.Request().Context(), context.App.Db)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if res, _ := result.RowsAffected(); res == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "Campaign not found")
	}

	return context.String(http.StatusOK, "OK")
}
