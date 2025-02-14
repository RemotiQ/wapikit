package analytics_controller

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wapikit/wapikit/.db-generated/model"
	"github.com/wapikit/wapikit/.db-generated/table"
	"github.com/wapikit/wapikit/api/api_types"
	controller "github.com/wapikit/wapikit/api/controllers"
	"github.com/wapikit/wapikit/interfaces"
	"github.com/wapikit/wapikit/utils"

	"github.com/go-jet/jet/qrm"
	. "github.com/go-jet/jet/v2/postgres"
)

type AnalyticsController struct {
	controller.BaseController `json:"-,inline"`
}

func NewAnalyticsController() *AnalyticsController {
	return &AnalyticsController{
		BaseController: controller.BaseController{
			Name:        "Analytics Controller",
			RestApiPath: "/api/analytics",
			Routes: []interfaces.Route{
				{
					Path:                    "/api/analytics/campaigns",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleAggregateCampaignAnalytics),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetPrimaryAnalytics,
						},
					},
				},
				{
					Path:                    "/api/analytics/aggregate-counts",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(getDashboardAggregateAnalytics),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetPrimaryAnalytics,
						},
					},
				},
				{
					Path:                    "/api/analytics/conversations",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleAggregateConversationAnalytics),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetSecondaryAnalytics,
						},
					},
				},
				{
					Path:                    "/api/analytics/campaign/:campaignId",
					Method:                  http.MethodGet,
					Handler:                 interfaces.HandlerWithSession(handleGetCampaignAnalyticsById),
					IsAuthorizationRequired: true,
					MetaData: interfaces.RouteMetaData{
						PermissionRoleLevel: api_types.Member,
						RequiredPermission: []api_types.RolePermissionEnum{
							api_types.GetCampaignAnalytics,
						},
					},
				},
			},
		},
	}
}

func getDashboardAggregateAnalytics(context interfaces.ContextWithSession) error {
	params := new(api_types.GetAggregateCampaignAnalyticsParams)
	err := utils.BindQueryParams(context, params)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	orgUuid, err := uuid.Parse(context.Session.User.OrganizationId)

	if err != nil {
		return context.JSON(http.StatusInternalServerError, "Invalid organization id")
	}

	cacheKey := context.App.Redis.ComputeCacheKey(
		"getDashboardAggregateAnalytics",
		orgUuid.String(),
		"aggregate_counts",
	)

	var responseToReturn *api_types.DashboardAggregateCountResponseSchema
	ok, _ := context.App.Redis.GetCachedData(cacheKey, &responseToReturn)

	if ok {
		fmt.Println("Returning cached data")
		return context.JSON(http.StatusOK, responseToReturn)
	}

	var aggregateAnalyticsData struct {
		CampaignsCancelled   int `json:"campaignsCancelled"`
		CampaignsDraft       int `json:"campaignsDraft"`
		CampaignsFinished    int `json:"campaignsFinished"`
		CampaignsPaused      int `json:"campaignsPaused"`
		CampaignsRunning     int `json:"campaignsRunning"`
		CampaignsScheduled   int `json:"campaignsScheduled"`
		TotalCampaigns       int `json:"totalCampaigns"`
		ContactsActive       int `json:"contactsActive"`
		ContactsBlocked      int `json:"contactsBlocked"`
		TotalContacts        int `json:"totalContacts"`
		ConversationsActive  int `json:"conversationsActive"`
		ConversationsClosed  int `json:"conversationsClosed"`
		ConversationsPending int `json:"conversationsPending"`
		TotalConversations   int `json:"totalConversations"`
		MessagesDelivered    int `json:"messagesDelivered"`
		MessagesFailed       int `json:"messagesFailed"`
		MessagesRead         int `json:"messagesRead"`
		MessagesSent         int `json:"messagesSent"`
		MessagesUndelivered  int `json:"messagesUndelivered"`
		MessagesUnread       int `json:"messagesUnread"`
		TotalMessages        int `json:"totalMessages"`
	}

	CampaignStatsCte := CTE("campaignStats")
	ContactStatsCte := CTE("contactStats")
	ConversationStatsCte := CTE("conversationStats")
	MessageStatsCte := CTE("messageStats")

	aggregateStatsQuery := WITH(
		CampaignStatsCte.AS(
			SELECT(
				COALESCE(
					SUM(CASE().
						WHEN(table.Campaign.Status.EQ(utils.EnumExpression(model.CampaignStatusEnum_Draft.String()))).
						THEN(CAST(CAST(Int(1)).AS_INTEGER()).AS_INTEGER()).
						ELSE(CAST(CAST(Int(0)).AS_INTEGER()).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("campaignsDraft"),
				COALESCE(
					SUM(CASE().
						WHEN(table.Campaign.Status.EQ(utils.EnumExpression(model.CampaignStatusEnum_Cancelled.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("campaignsCancelled"),
				COALESCE(
					SUM(CASE().
						WHEN(table.Campaign.Status.EQ(utils.EnumExpression(model.CampaignStatusEnum_Running.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("campaignsRunning"),
				COALESCE(
					SUM(CASE().
						WHEN(table.Campaign.Status.EQ(utils.EnumExpression(model.CampaignStatusEnum_Finished.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("campaignsFinished"),
				COALESCE(
					SUM(CASE().
						WHEN(table.Campaign.Status.EQ(utils.EnumExpression(model.CampaignStatusEnum_Paused.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("campaignsPaused"),
				COALESCE(
					SUM(CASE().
						WHEN(table.Campaign.Status.EQ(utils.EnumExpression(model.CampaignStatusEnum_Scheduled.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("campaignsScheduled"),
				COUNT(table.Campaign.UniqueId).AS("totalCampaigns"),
			).FROM(table.Campaign).
				WHERE(table.Campaign.OrganizationId.EQ(UUID(orgUuid))),
		),
		ContactStatsCte.AS(
			SELECT(
				COALESCE(
					SUM(CASE().
						WHEN(table.Contact.Status.EQ(utils.EnumExpression(model.ContactStatusEnum_Active.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("contactsActive"),
				COALESCE(
					SUM(CASE().
						WHEN(table.Contact.Status.EQ(utils.EnumExpression(model.ContactStatusEnum_Blocked.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("contactsBlocked"),
				COUNT(table.Contact.UniqueId).AS("totalContacts"),
			).FROM(table.Contact).
				WHERE(table.Contact.OrganizationId.EQ(UUID(orgUuid))),
		),
		ConversationStatsCte.AS(
			SELECT(
				COALESCE(
					SUM(CASE().
						WHEN(table.Conversation.Status.EQ(utils.EnumExpression(model.ConversationStatusEnum_Active.String()))).THEN(CAST(Int(1)).AS_INTEGER()).ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("conversationsActive"),
				COALESCE(
					SUM(CASE().
						WHEN(table.Conversation.Status.EQ(utils.EnumExpression(model.ConversationStatusEnum_Closed.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("conversationsClosed"),
				// SUM(CASE(table.Conversation.Status.EQ(String(string(api_types.conversa)))).THEN(CAST(Int(1)).AS_INTEGER()).ELSE(CAST(Int(0)).AS_INTEGER())).AS("pending"), // here we need to determine if there are unread incoming messages for a conversation exists then SUM it in pending
				COUNT(table.Conversation.UniqueId).AS("totalConversations"),
			).FROM(table.Conversation).
				WHERE(table.Conversation.OrganizationId.EQ(UUID(orgUuid))),
		),
		MessageStatsCte.AS(
			SELECT(
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Delivered.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesDelivered"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Failed.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesFailed"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Read.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesRead"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Sent.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesSent"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_UnDelivered.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesUndelivered"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Read.String()))).
						THEN(CAST(Int(0)).AS_INTEGER()).
						ELSE(CAST(Int(1)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesUnread"),
				COUNT(table.Message.UniqueId).AS("totalMessages"),
			).FROM(table.Message).
				WHERE(table.Message.OrganizationId.EQ(UUID(orgUuid))),
		),
	)(SELECT(
		CampaignStatsCte.AllColumns(),
		ContactStatsCte.AllColumns(),
		ConversationStatsCte.AllColumns(),
		MessageStatsCte.AllColumns(),
	).FROM(
		CampaignStatsCte,
		ContactStatsCte,
		ConversationStatsCte,
		MessageStatsCte,
	))

	err = aggregateStatsQuery.QueryContext(context.Request().Context(), context.App.Db, &aggregateAnalyticsData)

	if err != nil {
		fmt.Println("error is", err.Error())
		if err.Error() == qrm.ErrNoRows.Error() {
			fmt.Println("No aggregate stats found")
			// do nothing keep the empty response as defined above in the controller
		} else {
			return context.JSON(http.StatusInternalServerError, "Error getting aggregate stats")
		}
	}

	responseToReturn = &api_types.DashboardAggregateCountResponseSchema{
		AggregateAnalytics: api_types.AggregateAnalyticsSchema{
			CampaignStats: api_types.AggregateCampaignStatsDataPointsSchema{
				CampaignsCancelled: aggregateAnalyticsData.CampaignsCancelled,
				CampaignsRunning:   aggregateAnalyticsData.CampaignsRunning,
				CampaignsDraft:     aggregateAnalyticsData.CampaignsDraft,
				CampaignsFinished:  aggregateAnalyticsData.CampaignsFinished,
				CampaignsPaused:    aggregateAnalyticsData.CampaignsPaused,
				CampaignsScheduled: aggregateAnalyticsData.CampaignsScheduled,
				TotalCampaigns:     aggregateAnalyticsData.TotalCampaigns,
			},
			ContactStats: api_types.AggregateContactStatsDataPointsSchema{
				ContactsActive:  aggregateAnalyticsData.ContactsActive,
				ContactsBlocked: aggregateAnalyticsData.ContactsBlocked,
				TotalContacts:   aggregateAnalyticsData.TotalContacts,
			},
			ConversationStats: api_types.AggregateConversationStatsDataPointsSchema{
				ConversationsActive:  aggregateAnalyticsData.ConversationsActive,
				ConversationsClosed:  aggregateAnalyticsData.ConversationsClosed,
				ConversationsPending: 0,
				TotalConversations:   aggregateAnalyticsData.TotalConversations,
			},
			MessageStats: api_types.AggregateMessageStatsDataPointsSchema{
				MessagesDelivered:   aggregateAnalyticsData.MessagesDelivered,
				MessagesFailed:      aggregateAnalyticsData.MessagesFailed,
				MessagesRead:        aggregateAnalyticsData.MessagesRead,
				MessagesSent:        aggregateAnalyticsData.MessagesSent,
				TotalMessages:       aggregateAnalyticsData.TotalMessages,
				MessagesUndelivered: aggregateAnalyticsData.MessagesUndelivered,
				MessagesUnread:      aggregateAnalyticsData.MessagesUnread,
			},
		},
	}

	// cache the data for 10 minutes
	context.App.Redis.CacheData(cacheKey, responseToReturn, 10*time.Minute)

	return context.JSON(http.StatusOK, responseToReturn)

}

func handleAggregateCampaignAnalytics(context interfaces.ContextWithSession) error {
	params := new(api_types.GetAggregateCampaignAnalyticsParams)
	err := utils.BindQueryParams(context, params)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	minDateRange := params.From
	maxDateRange := params.To
	if minDateRange.IsZero() || maxDateRange.IsZero() {
		return context.JSON(http.StatusBadRequest, "Invalid date range")
	}

	orgUuid, err := uuid.Parse(context.Session.User.OrganizationId)
	if err != nil {
		return context.JSON(http.StatusInternalServerError, "Invalid organization id")
	}

	cacheKey := context.App.Redis.ComputeCacheKey(
		"handleAggregateCampaignAnalytics",
		strings.Join([]string{orgUuid.String(), minDateRange.String(), maxDateRange.String()}, ":"),
		"campaigns_analytics",
	)

	var responseToReturn *api_types.GetAggregateCampaignAnalyticsResponseSchema
	ok, _ := context.App.Redis.GetCachedData(cacheKey, &responseToReturn)
	if ok {
		return context.JSON(http.StatusOK, responseToReturn)
	}

	// Query daily link click data.
	linkClickDataQuery := SELECT(
		table.TrackLinkClick.CreatedAt.AS("date"),
		COALESCE(COUNT(table.TrackLinkClick.UniqueId), Int(0)).AS("count"),
		TO_CHAR(table.TrackLinkClick.CreatedAt, String("DD-MM-YYYY")).AS("label"),
	).
		FROM(
			table.TrackLinkClick.
				LEFT_JOIN(table.TrackLink, table.TrackLinkClick.TrackLinkId.EQ(table.TrackLink.UniqueId)),
		).
		WHERE(
			table.TrackLink.OrganizationId.EQ(UUID(orgUuid)).
				AND(
					table.TrackLinkClick.CreatedAt.BETWEEN(
						TimestampzExp(TimestampzT(minDateRange)),
						TimestampzExp(TimestampzT(maxDateRange)),
					),
				),
		).
		GROUP_BY(table.TrackLinkClick.CreatedAt).
		ORDER_BY(table.TrackLinkClick.CreatedAt)

	// Query daily message analytics.
	messageDataSeriesQuery := SELECT(
		table.Message.CreatedAt.AS("date"),
		COALESCE(SUM(CASE().
			WHEN(table.Message.Direction.EQ(utils.EnumExpression(model.MessageDirectionEnum_OutBound.String()))).
			THEN(CAST(Int(1)).AS_INTEGER()).
			ELSE(CAST(Int(0)).AS_INTEGER()),
		), CAST(Int(0)).AS_INTEGER()).AS("sent"),
		COALESCE(SUM(CASE().
			WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Read.String()))).
			THEN(CAST(Int(1)).AS_INTEGER()).
			ELSE(CAST(Int(0)).AS_INTEGER()),
		), CAST(Int(0)).AS_INTEGER()).AS("read"),
		COALESCE(SUM(CASE().
			WHEN(table.Message.RepliedTo.IS_NOT_NULL()).
			THEN(CAST(Int(1)).AS_INTEGER()).
			ELSE(CAST(Int(0)).AS_INTEGER()),
		), CAST(Int(0)).AS_INTEGER()).AS("replied"),
		TO_CHAR(table.Message.CreatedAt, String("DD-MM-YYYY")).AS("label"),
	).
		FROM(table.Message).
		WHERE(
			table.Message.OrganizationId.EQ(UUID(orgUuid)).
				AND(
					table.Message.CreatedAt.BETWEEN(
						TimestampzExp(TimestampzT(minDateRange)),
						TimestampzExp(TimestampzT(maxDateRange)),
					),
				),
		).
		GROUP_BY(table.Message.CreatedAt).
		ORDER_BY(table.Message.CreatedAt)

	var linkDataSeries []api_types.DateToCountGraphDataPointSchema
	err = linkClickDataQuery.QueryContext(context.Request().Context(), context.App.Db, &linkDataSeries)
	if err != nil && err != sql.ErrNoRows {
		fmt.Println("error is", err.Error())
		return context.JSON(http.StatusInternalServerError, "Error getting link click data")
	}

	var messageDataSeries []api_types.MessageAnalyticGraphDataPointSchema
	err = messageDataSeriesQuery.QueryContext(context.Request().Context(), context.App.Db, &messageDataSeries)
	if err != nil && err != sql.ErrNoRows {
		fmt.Println("error is", err.Error())
		return context.JSON(http.StatusInternalServerError, "Error getting message data")
	}

	// Aggregate totals from daily series.
	var totalMessagesSent, totalMessagesRead, totalReplies int
	for _, m := range messageDataSeries {
		totalMessagesSent += m.Sent
		totalMessagesRead += m.Read
		totalReplies += m.Replied
	}
	var totalLinkClicks int
	for _, d := range linkDataSeries {
		totalLinkClicks += d.Count
	}

	var openRate, clickRate, engagementRate float64
	if totalMessagesSent > 0 {
		openRate = (float64(totalMessagesRead) / float64(totalMessagesSent)) * 100
		clickRate = (float64(totalLinkClicks) / float64(totalMessagesSent)) * 100
		engagementRate = (float64(totalLinkClicks+totalReplies) / float64(totalMessagesSent)) * 100
	}

	fmt.Println("clickRate", clickRate)

	responseToReturn = &api_types.GetAggregateCampaignAnalyticsResponseSchema{
		Analytics: api_types.CampaignAnalyticsResponseSchema{
			OpenRate:              openRate,
			ResponseRate:          0, // ! TODO: implement
			EngagementRate:        engagementRate,
			EngagementTrends:      []api_types.DateToCountGraphDataPointSchema{}, // Optionally merge clicks & replies
			LinkClicksData:        linkDataSeries,
			MessageAnalytics:      messageDataSeries,
			MessagesDelivered:     0,
			MessagesFailed:        0,
			MessagesRead:          totalMessagesRead,
			MessagesSent:          totalMessagesSent,
			MessagesUndelivered:   0,
			TotalLinkClicks:       totalLinkClicks,
			TotalMessages:         totalMessagesSent,
			ConversationInitiated: 0,
		},
	}

	context.App.Redis.CacheData(cacheKey, responseToReturn, 10*time.Minute)
	return context.JSON(http.StatusOK, responseToReturn)
}

func handleAggregateConversationAnalytics(context interfaces.ContextWithSession) error {
	logger := context.App.Logger
	// Compute conversation analytics:
	// - Average response time (seconds)
	// - Total active conversations
	// - Total service conversations (initiated by "Contact")
	// - Inbound/outbound message ratio
	// - Message type distribution

	orgUuid, err := uuid.Parse(context.Session.User.OrganizationId)
	if err != nil {
		return context.JSON(http.StatusInternalServerError, "Invalid organization id")
	}

	// Raw SQL query for average response time:
	// For each conversation, compute MIN(out.CreatedAt - in.CreatedAt) where out is the first outbound after an inbound.
	var avgResponseTime sql.NullFloat64
	rawAvgQuery := `
		SELECT AVG(diff) 
			FROM (
    			SELECT MIN(m_out."CreatedAt" - m_in."CreatedAt") AS diff
    			FROM "Message" m_in
    			JOIN "Message" m_out ON m_in."ConversationId" = m_out."ConversationId"
    			WHERE m_in."OrganizationId" = $1
      				AND m_in."Direction" = 'InBound'
      				AND m_out."Direction" = 'OutBound'
      				AND m_out."CreatedAt" > m_in."CreatedAt"
    			GROUP BY m_in."ConversationId"
				) sub;
	`
	err = context.App.Db.QueryRowContext(context.Request().Context(), rawAvgQuery, orgUuid).Scan(&avgResponseTime)
	if err != nil && err != sql.ErrNoRows {
		logger.Error("Error computing average response time", err.Error(), nil)
		return context.JSON(http.StatusInternalServerError, "Error computing average response time")
	}

	// Active conversations.
	activeConversationsQuery := SELECT(
		COUNT(table.Conversation.UniqueId).AS("activeCount"),
	).
		FROM(table.Conversation).
		WHERE(
			table.Conversation.OrganizationId.EQ(UUID(orgUuid)).
				AND(table.Conversation.Status.EQ(utils.EnumExpression(model.ConversationStatusEnum_Active.String()))),
		)

	var activeCountDest struct {
		ActiveCount int
	}
	err = activeConversationsQuery.QueryContext(context.Request().Context(), context.App.Db, &activeCountDest)
	if err != nil && err != sql.ErrNoRows {
		return context.JSON(http.StatusInternalServerError, "Error getting active conversations")
	}

	// Service conversations: initiated by "Contact".
	serviceConversationsQuery := SELECT(
		COUNT(table.Conversation.UniqueId).AS("serviceCount"),
	).
		FROM(table.Conversation).
		WHERE(
			table.Conversation.OrganizationId.EQ(UUID(orgUuid)).
				AND(table.Conversation.InitiatedBy.EQ(utils.EnumExpression("Contact"))),
		)
	var serviceCountDest struct {
		ServiceCount int
	}
	err = serviceConversationsQuery.QueryContext(context.Request().Context(), context.App.Db, &serviceCountDest)
	if err != nil && err != sql.ErrNoRows {
		logger.Error("Error getting service conversations", err.Error(), nil)
		return context.JSON(http.StatusInternalServerError, "Error getting service conversations")
	}

	// Inbound and outbound message counts.
	inboundOutboundQuery := SELECT(
		COALESCE(SUM(CASE().
			WHEN(table.Message.Direction.EQ(utils.EnumExpression(model.MessageDirectionEnum_InBound.String()))).
			THEN(CAST(Int(1)).AS_INTEGER()).
			ELSE(CAST(Int(0)).AS_INTEGER()),
		), CAST(Int(0)).AS_INTEGER()).AS("inbound"),
		COALESCE(SUM(CASE().
			WHEN(table.Message.Direction.EQ(utils.EnumExpression(model.MessageDirectionEnum_OutBound.String()))).
			THEN(CAST(Int(1)).AS_INTEGER()).
			ELSE(CAST(Int(0)).AS_INTEGER()),
		), CAST(Int(0)).AS_INTEGER()).AS("outbound"),
	).
		FROM(table.Message).
		WHERE(table.Message.OrganizationId.EQ(UUID(orgUuid)))
	var dest struct {
		Inbound  int
		Outbound int
	}
	err = inboundOutboundQuery.QueryContext(context.Request().Context(), context.App.Db, &dest)
	if err != nil && err != sql.ErrNoRows {
		logger.Error("Error getting inbound/outbound counts", err.Error(), nil)
		return context.JSON(http.StatusInternalServerError, "Error getting inbound/outbound counts")
	}
	var inboundOutboundRatio float64
	if dest.Outbound > 0 {
		inboundOutboundRatio = float64(dest.Inbound) / float64(dest.Outbound)
	}

	// Message type distribution grouped by MessageType.
	messageTypeDistributionQuery := SELECT(
		table.Message.MessageType,
		COUNT(table.Message.UniqueId).AS("count"),
	).
		FROM(table.Message).
		WHERE(table.Message.OrganizationId.EQ(UUID(orgUuid))).
		GROUP_BY(table.Message.MessageType).
		ORDER_BY(table.Message.MessageType)
	var messageTypeDistribution []api_types.MessageTypeDistributionGraphDataPointSchema
	err = messageTypeDistributionQuery.QueryContext(context.Request().Context(), context.App.Db, &messageTypeDistribution)
	if err != nil && err != sql.ErrNoRows {
		return context.JSON(http.StatusInternalServerError, "Error getting message type distribution")
	}

	responseToReturn := api_types.GetConversationAnalyticsResponseSchema{
		Analytics: api_types.ConversationAggregateAnalytics{
			ConversationsActive:                     activeCountDest.ActiveCount,
			ConversationsClosed:                     0,
			ConversationsPending:                    0,
			InboundToOutboundRatio:                  inboundOutboundRatio,
			ServiceConversations:                    serviceCountDest.ServiceCount,
			TotalConversations:                      activeCountDest.ActiveCount, // Optionally add closed count
			AvgResponseTimeInMinutes:                avgResponseTime.Float64,
			ConversationsAnalytics:                  []api_types.ConversationAnalyticsDataPointSchema{},
			MessageTypeTrafficDistributionAnalytics: messageTypeDistribution,
		},
	}

	return context.JSON(http.StatusOK, responseToReturn)
}

func handleGetCampaignAnalyticsById(context interfaces.ContextWithSession) error {
	var campaignAnalyticsData struct {
		MessagesDelivered     int                                         `json:"messagesDelivered"`
		MessagesFailed        int                                         `json:"messagesFailed"`
		MessagesRead          int                                         `json:"messagesRead"`
		MessagesSent          int                                         `json:"messagesSent"`
		MessagesUndelivered   int                                         `json:"messagesUndelivered"`
		TotalMessages         int                                         `json:"totalMessages"`
		TotalLinkClicks       int                                         `json:"totalLinkClicks"`
		ConversationInitiated int                                         `json:"conversationInitiated"`
		LinkClicksData        []api_types.DateToCountGraphDataPointSchema `json:"linkClicksData"`
	}

	campaignMessageDataCte := CTE("messageStats")
	linkClicksCountsCte := CTE("linkStats")
	conversationCountCte := CTE("conversationInitiated")
	linkClicksDataCte := CTE("linkClicksData")

	campaignAnalyticsQuery := WITH(
		campaignMessageDataCte.AS(
			SELECT(
				COUNT(table.Message.UniqueId).AS("totalMessages"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Delivered.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesDelivered"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Failed.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesFailed"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Read.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesRead"),
				COALESCE(

					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_Sent.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesSent"),
				COALESCE(
					SUM(CASE().WHEN(table.Message.Status.EQ(utils.EnumExpression(model.MessageStatusEnum_UnDelivered.String()))).
						THEN(CAST(Int(1)).AS_INTEGER()).
						ELSE(CAST(Int(0)).AS_INTEGER())), CAST(Int(0)).AS_INTEGER()).AS("messagesUndelivered"),
			).FROM(
				table.Message,
			).WHERE(
				table.Message.CampaignId.EQ(UUID(uuid.MustParse(context.Param("campaignId")))),
			),
		),
		linkClicksCountsCte.AS(
			SELECT(
				COALESCE(
					COUNT(table.TrackLinkClick.UniqueId), CAST(Int(0)).AS_INTEGER()).AS("totalLinkClicks"),
			).FROM(
				table.TrackLinkClick.LEFT_JOIN(table.TrackLink, table.TrackLink.UniqueId.EQ(table.TrackLinkClick.TrackLinkId)),
			).WHERE(
				table.TrackLink.CampaignId.EQ(UUID(uuid.MustParse(context.Param("campaignId")))),
			),
		),
		conversationCountCte.AS(
			SELECT(
				COALESCE(
					COUNT(table.Conversation.UniqueId), CAST(Int(0)).AS_INTEGER()).AS("conversationInitiated"),
			).FROM(
				table.Conversation,
			).WHERE(
				table.Conversation.InitiatedByCampaignId.EQ(
					UUID(uuid.MustParse(context.Param("campaignId"))),
				).AND(
					table.Conversation.InitiatedBy.EQ(utils.EnumExpression(model.ConversationInitiatedEnum_Campaign.String())),
				),
			)),
		linkClicksDataCte.AS(
			SELECT(
				table.TrackLinkClick.CreatedAt.AS("date"),
				COALESCE(COUNT(table.TrackLinkClick.UniqueId), Int(0)).AS("count"),
				TO_CHAR(table.TrackLinkClick.CreatedAt, String("DD-MM-YYYY")).AS("label"),
			).FROM(
				table.TrackLinkClick.
					LEFT_JOIN(table.TrackLink, table.TrackLink.UniqueId.EQ(table.TrackLinkClick.TrackLinkId)),
			).WHERE(
				table.TrackLink.CampaignId.EQ(UUID(uuid.MustParse(context.Param("campaignId")))),
			).GROUP_BY(
				table.TrackLinkClick.CreatedAt,
			).ORDER_BY(
				table.TrackLinkClick.CreatedAt,
			),
		),
	)(SELECT(
		campaignMessageDataCte.AllColumns(),
		linkClicksCountsCte.AllColumns(),
		linkClicksDataCte.AllColumns(),
		conversationCountCte.AllColumns(),
	).FROM(
		campaignMessageDataCte,
		linkClicksCountsCte,
		linkClicksDataCte,
		conversationCountCte,
	))

	sql := campaignAnalyticsQuery.DebugSql()

	fmt.Println("SQL", sql)

	err := campaignAnalyticsQuery.QueryContext(context.Request().Context(), context.App.Db, &campaignAnalyticsData)

	if err != nil {
		fmt.Println("error is", err.Error())
		if err.Error() == qrm.ErrNoRows.Error() {
			context.App.Logger.Info("No campaign analytics found")
			responseToReturn := api_types.CampaignAnalyticsResponseSchema{
				MessagesDelivered:     0,
				MessagesFailed:        0,
				MessagesRead:          0,
				MessagesSent:          0,
				MessagesUndelivered:   0,
				TotalMessages:         0,
				ConversationInitiated: 0,
				TotalLinkClicks:       0,
				LinkClicksData:        []api_types.DateToCountGraphDataPointSchema{},
			}
			return context.JSON(http.StatusOK, responseToReturn)
		} else {
			return context.JSON(http.StatusInternalServerError, "Error getting campaign analytics")
		}
	}

	responseToReturn := api_types.CampaignAnalyticsResponseSchema{
		MessagesDelivered:     campaignAnalyticsData.MessagesDelivered,
		MessagesFailed:        campaignAnalyticsData.MessagesFailed,
		MessagesRead:          campaignAnalyticsData.MessagesRead,
		MessagesSent:          campaignAnalyticsData.MessagesSent,
		MessagesUndelivered:   campaignAnalyticsData.MessagesUndelivered,
		TotalMessages:         campaignAnalyticsData.TotalMessages,
		ConversationInitiated: campaignAnalyticsData.ConversationInitiated,
		TotalLinkClicks:       campaignAnalyticsData.TotalLinkClicks,
		LinkClicksData:        campaignAnalyticsData.LinkClicksData,
	}

	return context.JSON(http.StatusOK, responseToReturn)
}
