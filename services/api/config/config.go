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
	// Try multiple paths: current dir, parent dir, or two levels up
	envPaths := []string{".env", "../.env", "../../.env"}
	loaded := false
	for _, path := range envPaths {
		if err := godotenv.Load(path); err == nil {
			log.Printf("Loaded .env from %s", path)
			loaded = true
			break
		}
	}
	if !loaded {
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
