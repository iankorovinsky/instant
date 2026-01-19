package projections

import (
	"fmt"
	"time"
)

// parseTime parses a time value from various types (time.Time, string, nil).
func parseTime(value interface{}) (time.Time, error) {
	switch v := value.(type) {
	case time.Time:
		return v, nil
	case string:
		parsed, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return time.Time{}, fmt.Errorf("invalid time format: %w", err)
		}
		return parsed, nil
	case nil:
		return time.Time{}, nil
	default:
		return time.Time{}, fmt.Errorf("unsupported time value: %T", value)
	}
}

// nullableString converts empty strings and nil to nil for database NULL handling.
func nullableString(value interface{}) interface{} {
	if value == nil {
		return nil
	}
	if s, ok := value.(string); ok && s == "" {
		return nil
	}
	return value
}
