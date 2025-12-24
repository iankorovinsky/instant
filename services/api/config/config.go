package config

import (
	"os"
)

type Config struct {
	Port            string
	DatabaseURL     string
	TemporalAddress string
	Environment     string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", ""),
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
