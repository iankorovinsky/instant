package routes

import (
	"instant/services/api/events"
	"instant/services/api/eventstore"
	"instant/services/api/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	omsCommandHandler *handlers.OMSCommandHandler,
	omsQueryHandler *handlers.OMSQueryHandler,
	emsCommandHandler *handlers.EMSCommandHandler,
	emsQueryHandler *handlers.EMSQueryHandler,
	pmsCommandHandler *handlers.PMSCommandHandler,
	pmsQueryHandler *handlers.PMSQueryHandler,
	complianceCommandHandler *handlers.ComplianceCommandHandler,
	complianceQueryHandler *handlers.ComplianceQueryHandler,
	marketDataQueryHandler *handlers.MarketDataQueryHandler,
	copilotCommandHandler *handlers.CopilotCommandHandler,
	eventStore *eventstore.EventStore,
) {
	// Health check
	router.GET("/health", healthCheck)

	// OMS Commands (write operations)
	api := router.Group("/api")
	{
		oms := api.Group("/oms")
		{
			// RESTful OMS endpoints
			oms.POST("/orders", omsCommandHandler.HandleCreateOrder)
			oms.POST("/orders/bulk", omsCommandHandler.HandleBulkCreateOrders)
			oms.PATCH("/orders/:id/amend", omsCommandHandler.HandleAmendOrder)
			oms.POST("/orders/:id/approve", omsCommandHandler.HandleApproveOrder)
			oms.POST("/orders/:id/cancel", omsCommandHandler.HandleCancelOrder)
			oms.POST("/orders/:id/send-to-ems", omsCommandHandler.HandleSendToEMS)
		}

		ems := api.Group("/ems")
		{
			ems.POST("/executions/request", emsCommandHandler.HandleRequestExecution)
		}

		pms := api.Group("/pms")
		{
			pms.POST("/targets", pmsCommandHandler.HandleSetTarget)
			pms.POST("/optimization", pmsCommandHandler.HandleRunOptimization)
			pms.POST("/proposals/:id/approve", pmsCommandHandler.HandleApproveProposal)
			pms.POST("/proposals/:id/send-to-oms", pmsCommandHandler.HandleSendProposalToOMS)
		}

		compliance := api.Group("/compliance")
		{
			compliance.POST("/rules", complianceCommandHandler.CreateRule)
			compliance.PATCH("/rules/:id", complianceCommandHandler.UpdateRule)
			compliance.POST("/rules/:id/enable", complianceCommandHandler.EnableRule)
			compliance.POST("/rules/:id/disable", complianceCommandHandler.DisableRule)
			compliance.DELETE("/rules/:id", complianceCommandHandler.DeleteRule)
			compliance.POST("/rule-sets/:id/publish", complianceCommandHandler.PublishRuleSet)
		}

		// Copilot endpoints (AI Draft management)
		copilot := api.Group("/copilot")
		{
			copilot.POST("/drafts", copilotCommandHandler.HandleCreateDraft)
			copilot.POST("/drafts/:id/approve", copilotCommandHandler.HandleApproveDraft)
			copilot.POST("/drafts/:id/reject", copilotCommandHandler.HandleRejectDraft)
		}

		// Generic command endpoint (for event-driven architecture)
		api.POST("/commands", omsCommandHandler.HandleCommandRouter)
	}

	// Views (read operations - projections)
	views := router.Group("/api/views")
	{
		// OMS Views
		views.GET("/blotter", omsQueryHandler.GetBlotter)
		views.GET("/orders/:id", omsQueryHandler.GetOrderByID)
		views.GET("/orders/batch/:batchId", omsQueryHandler.GetOrdersByBatchID)
		views.GET("/executions", emsQueryHandler.GetExecutions)
		views.GET("/executions/:id", emsQueryHandler.GetExecutionByID)

		// Market data views
		views.GET("/instruments", marketDataQueryHandler.GetInstruments)
		views.GET("/instruments/:cusip", marketDataQueryHandler.GetInstrumentByCusip)
		views.GET("/curves", marketDataQueryHandler.GetYieldCurve)
		views.GET("/curves/dates", marketDataQueryHandler.GetCurveDates)
		views.GET("/market-grid", marketDataQueryHandler.GetMarketGrid)
		views.GET("/pricing/:cusip", marketDataQueryHandler.GetEvaluatedPricing)
		views.GET("/pricing/:cusip/history", marketDataQueryHandler.GetPricingHistory)
		views.GET("/marketdata/summary", marketDataQueryHandler.GetMarketDataSummary)

		// Other views (to be implemented)
		views.GET("/accounts", pmsQueryHandler.GetAccounts)
		views.GET("/accounts/:id", pmsQueryHandler.GetAccountView)
		views.GET("/households", pmsQueryHandler.GetHouseholds)
		views.GET("/households/:id", pmsQueryHandler.GetHouseholdView)
		views.GET("/proposals", pmsQueryHandler.GetProposals)
		views.GET("/proposals/:id", pmsQueryHandler.GetProposalByID)
		views.GET("/drift", pmsQueryHandler.GetDriftView)
		views.GET("/compliance", getComplianceStatus)
		views.GET("/compliance/rules", complianceQueryHandler.GetRules)
		views.GET("/compliance/rules/:id", complianceQueryHandler.GetRuleDetail)
		views.GET("/compliance/violations", complianceQueryHandler.GetViolations)
	}

	// Events (event store queries)
	events := router.Group("/api/events")
	{
		events.GET("", func(c *gin.Context) {
			getEvents(c, eventStore)
		})
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{"status": "healthy"})
}

func handleCommand(c *gin.Context) {
	// TODO: Implement command handler
	c.JSON(501, gin.H{"error": "not implemented"})
}

func getBlotter(c *gin.Context) {
	// TODO: Implement blotter view
	c.JSON(501, gin.H{"error": "not implemented"})
}

func getMarketGrid(c *gin.Context) {
	// TODO: Implement market grid view
	c.JSON(501, gin.H{"error": "not implemented"})
}

func getAccount(c *gin.Context) {
	// TODO: Implement account view
	c.JSON(501, gin.H{"error": "not implemented"})
}

func getProposal(c *gin.Context) {
	// TODO: Implement proposal view
	c.JSON(501, gin.H{"error": "not implemented"})
}

func getComplianceStatus(c *gin.Context) {
	// TODO: Implement compliance status view
	c.JSON(501, gin.H{"error": "not implemented"})
}

func getEvents(c *gin.Context, eventStore *eventstore.EventStore) {
	// Query parameters
	aggregateType := c.Query("aggregateType")
	aggregateID := c.Query("aggregateId")
	correlationID := c.Query("correlationId")
	eventType := c.Query("eventType")

	var evts []*events.Event
	var err error

	if aggregateType != "" && aggregateID != "" {
		// Get events by aggregate
		evts, err = eventStore.GetByAggregate(aggregateType, aggregateID)
	} else if correlationID != "" {
		// Get events by correlation ID
		evts, err = eventStore.GetByCorrelation(correlationID)
	} else if eventType != "" {
		// Get events by type
		evts, err = eventStore.GetByEventType(eventType)
	} else {
		// Get all events (use with caution)
		evts, err = eventStore.GetAll()
	}

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"events": evts,
		"count":  len(evts),
	})
}
