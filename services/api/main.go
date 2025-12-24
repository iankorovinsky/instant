package main

import (
	"instant/services/api/routes"
	"log"
	"github.com/gin-gonic/gin"
)

func main() {

	port := "8080"

	// Initialize Gin router
	router := gin.Default()

	// Setup routes
	routes.SetupRoutes(router)

	// Start server
	log.Printf("Starting server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
