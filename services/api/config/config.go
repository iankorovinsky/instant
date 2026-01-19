package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	DirectURL       string
	TemporalAddress string
	Environment     string
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", ""),
		DirectURL:       getEnv("DIRECT_URL", ""),
		TemporalAddress: getEnv("TEMPORAL_ADDRESS", "localhost:7233"),
		Environment:     getEnv("ENV", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
