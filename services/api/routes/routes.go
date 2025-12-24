package routes

import (
	"instant/services/api/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	// Health check
	router.GET("/health", healthCheck)

	// Commands (write operations)
	commands := router.Group("/commands")
	{
		commands.POST("", handlers.HandleCommand)
	}

	// Views (read operations - projections)
	views := router.Group("/views")
	{
		views.GET("/blotter", getBlotter)
		views.GET("/market-grid", getMarketGrid)
		views.GET("/accounts/:id", getAccount)
		views.GET("/proposals/:id", getProposal)
		views.GET("/compliance", getComplianceStatus)
	}

	// Events (event store queries)
	events := router.Group("/events")
	{
		events.GET("", getEvents)
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

func getEvents(c *gin.Context) {
	// TODO: Implement events query
	c.JSON(501, gin.H{"error": "not implemented"})
}
