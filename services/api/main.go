package main

import (
	"instant/services/api/config"
	"instant/services/api/eventbus"
	"instant/services/api/eventstore"
	"instant/services/api/handlers"
	"instant/services/api/oms"
	"instant/services/api/projections"
	"instant/services/api/routes"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize EventStore
	log.Println("Initializing EventStore...")
	eventStore, err := eventstore.New(cfg.DirectURL)
	if err != nil {
		log.Fatalf("Failed to initialize EventStore: %v", err)
	}
	defer eventStore.Close()
	log.Println("EventStore initialized successfully")

	// Initialize EventBus
	log.Println("Initializing EventBus...")
	eventBus := eventbus.New()
	defer eventBus.Close()
	log.Println("EventBus initialized successfully")

	// Initialize OMS Service
	log.Println("Initializing OMS Service...")
	omsService := oms.NewService(eventStore, eventBus)
	log.Println("OMS Service initialized successfully")

	// Initialize OMS Handlers
	log.Println("Initializing OMS Handlers...")
	omsCommandHandler := handlers.NewOMSCommandHandler(omsService)
	omsQueryHandler, err := handlers.NewOMSQueryHandler(cfg.DirectURL, eventStore)
	if err != nil {
		log.Fatalf("Failed to initialize OMS Query Handler: %v", err)
	}
	defer omsQueryHandler.Close()
	log.Println("OMS Handlers initialized successfully")

	// Initialize OMS Projection Worker
	log.Println("Initializing OMS Projection Worker...")
	omsProjection, err := projections.NewOMSProjection(cfg.DirectURL, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize OMS Projection: %v", err)
	}
	defer omsProjection.Close()

	// Start projection worker in background
	go omsProjection.Start()
	log.Println("OMS Projection Worker started")

	// Initialize Gin router
	router := gin.Default()

	// Enable CORS
	router.Use(corsMiddleware())

	// Setup routes
	routes.SetupRoutes(router, omsCommandHandler, omsQueryHandler, eventStore)

	// Graceful shutdown handling
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", cfg.Port)
		if err := router.Run(":" + cfg.Port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-quit
	log.Println("Shutting down server...")

	// Stop projection worker
	omsProjection.Stop()

	log.Println("Server stopped gracefully")
}

// corsMiddleware adds CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Correlation-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
