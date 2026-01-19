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

		// Other views (to be implemented)
		views.GET("/market-grid", getMarketGrid)
		views.GET("/accounts/:id", getAccount)
		views.GET("/proposals/:id", getProposal)
		views.GET("/compliance", getComplianceStatus)
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
