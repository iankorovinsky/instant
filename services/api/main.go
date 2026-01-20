package main

import (
	"database/sql"
	"instant/services/api/config"
	"instant/services/api/ems"
	"instant/services/api/eventbus"
	"instant/services/api/eventstore"
	"instant/services/api/handlers"
	"instant/services/api/oms"
	"instant/services/api/pms"
	"instant/services/api/projections"
	"instant/services/api/routes"
	"instant/services/api/services/compliance"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
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

	// Initialize shared DB pool
	log.Println("Initializing shared DB pool...")
	db, err := sql.Open("postgres", cfg.DirectURL)
	if err != nil {
		log.Fatalf("Failed to initialize DB pool: %v", err)
	}
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(5 * time.Minute)
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping DB: %v", err)
	}
	defer db.Close()
	log.Println("DB pool initialized successfully")

	// Initialize EventBus
	log.Println("Initializing EventBus...")
	eventBus := eventbus.New()
	defer eventBus.Close()
	log.Println("EventBus initialized successfully")

	// Initialize Compliance Service
	log.Println("Initializing Compliance Service...")
	complianceService, err := compliance.NewService(db, eventStore, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize Compliance Service: %v", err)
	}
	log.Println("Compliance Service initialized successfully")

	// Initialize OMS Service
	log.Println("Initializing OMS Service...")
	omsService := oms.NewService(eventStore, eventBus, complianceService)
	log.Println("OMS Service initialized successfully")

	// Initialize OMS Handlers
	log.Println("Initializing OMS Handlers...")
	omsCommandHandler := handlers.NewOMSCommandHandler(omsService)
	omsQueryHandler, err := handlers.NewOMSQueryHandler(db, eventStore)
	if err != nil {
		log.Fatalf("Failed to initialize OMS Query Handler: %v", err)
	}
	log.Println("OMS Handlers initialized successfully")

	// Initialize EMS Service
	log.Println("Initializing EMS Service...")
	emsService, err := ems.NewService(db, eventStore, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize EMS Service: %v", err)
	}
	log.Println("EMS Service initialized successfully")

	// Initialize EMS Handlers
	log.Println("Initializing EMS Handlers...")
	emsCommandHandler := handlers.NewEMSCommandHandler(emsService)
	emsQueryHandler, err := handlers.NewEMSQueryHandler(db)
	if err != nil {
		log.Fatalf("Failed to initialize EMS Query Handler: %v", err)
	}
	log.Println("EMS Handlers initialized successfully")

	// Initialize PMS Service
	log.Println("Initializing PMS Service...")
	pmsService, err := pms.NewService(db, eventStore, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize PMS Service: %v", err)
	}
	log.Println("PMS Service initialized successfully")

	// Initialize PMS Handlers
	log.Println("Initializing PMS Handlers...")
	pmsCommandHandler := handlers.NewPMSCommandHandler(pmsService)
	pmsQueryHandler, err := handlers.NewPMSQueryHandler(db)
	if err != nil {
		log.Fatalf("Failed to initialize PMS Query Handler: %v", err)
	}
	log.Println("PMS Handlers initialized successfully")

	// Initialize Compliance Handlers
	log.Println("Initializing Compliance Handlers...")
	complianceCommandHandler := handlers.NewComplianceCommandHandler(complianceService)
	complianceQueryHandler, err := handlers.NewComplianceQueryHandler(db, eventStore)
	if err != nil {
		log.Fatalf("Failed to initialize Compliance Query Handler: %v", err)
	}
	log.Println("Compliance Handlers initialized successfully")

	// Initialize Market Data Handlers
	log.Println("Initializing Market Data Handlers...")
	marketDataQueryHandler, err := handlers.NewMarketDataQueryHandler(db)
	if err != nil {
		log.Fatalf("Failed to initialize Market Data Query Handler: %v", err)
	}
	log.Println("Market Data Handlers initialized successfully")

	// Initialize Copilot Handlers
	log.Println("Initializing Copilot Handlers...")
	copilotCommandHandler := handlers.NewCopilotCommandHandler(eventStore)
	log.Println("Copilot Handlers initialized successfully")

	// Initialize OMS Projection Worker
	log.Println("Initializing OMS Projection Worker...")
	omsProjection, err := projections.NewOMSProjection(db, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize OMS Projection: %v", err)
	}

	// Start projection worker in background
	go omsProjection.Start()
	log.Println("OMS Projection Worker started")

	// Initialize EMS Projection Worker
	log.Println("Initializing EMS Projection Worker...")
	emsProjection, err := projections.NewEMSProjection(db, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize EMS Projection: %v", err)
	}

	go emsProjection.Start()
	log.Println("EMS Projection Worker started")

	// Initialize PMS Projection Worker
	log.Println("Initializing PMS Projection Worker...")
	pmsProjection, err := projections.NewPMSProjection(db, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize PMS Projection: %v", err)
	}

	go pmsProjection.Start()
	log.Println("PMS Projection Worker started")

	// Initialize Compliance Projection Worker
	log.Println("Initializing Compliance Projection Worker...")
	complianceProjection, err := projections.NewComplianceProjection(db, eventBus)
	if err != nil {
		log.Fatalf("Failed to initialize Compliance Projection: %v", err)
	}

	go complianceProjection.Start()
	log.Println("Compliance Projection Worker started")

	// Start EMS simulation listener
	go emsService.Start()
	log.Println("EMS Service listener started")

	// Start Compliance service listener
	go complianceService.Start()
	log.Println("Compliance Service listener started")

	// Initialize Gin router
	router := gin.Default()

	// Enable CORS
	router.Use(corsMiddleware())

	// Setup routes
	routes.SetupRoutes(
		router,
		omsCommandHandler,
		omsQueryHandler,
		emsCommandHandler,
		emsQueryHandler,
		pmsCommandHandler,
		pmsQueryHandler,
		complianceCommandHandler,
		complianceQueryHandler,
		marketDataQueryHandler,
		copilotCommandHandler,
		eventStore,
	)

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
	emsProjection.Stop()
	pmsProjection.Stop()
	complianceProjection.Stop()
	emsService.Stop()
	complianceService.Stop()

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
