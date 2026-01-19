package eventstore

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"instant/services/api/events"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// EventStore handles event persistence and retrieval
type EventStore struct {
	db *sql.DB
}

// New creates a new EventStore instance
func New(databaseURL string) (*EventStore, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &EventStore{db: db}, nil
}

// Close closes the database connection
func (es *EventStore) Close() error {
	return es.db.Close()
}

// Append atomically writes an event to the event store
func (es *EventStore) Append(event *events.Event) error {
	// Generate event ID if not set
	if event.EventID == "" {
		event.EventID = uuid.New().String()
	}

	// Set occurred time if not set
	if event.OccurredAt.IsZero() {
		event.OccurredAt = time.Now().UTC()
	}

	// Marshal payload to JSON
	payloadJSON, err := json.Marshal(event.Payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	query := `
		INSERT INTO events (
			"eventId", "occurredAt", "eventType", "aggregateType", "aggregateId",
			"correlationId", "causationId", "actorId", "actorRole",
			payload, explanation, "schemaVersion"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = es.db.Exec(
		query,
		event.EventID,
		event.OccurredAt,
		event.EventType,
		event.Aggregate.Type,
		event.Aggregate.ID,
		event.CorrelationID,
		event.CausationID,
		event.Actor.ActorID,
		event.Actor.Role,
		payloadJSON,
		event.Explanation,
		event.SchemaVersion,
	)

	if err != nil {
		return fmt.Errorf("failed to insert event: %w", err)
	}

	return nil
}

// GetByAggregate retrieves all events for a specific aggregate
func (es *EventStore) GetByAggregate(aggregateType, aggregateID string) ([]*events.Event, error) {
	query := `
		SELECT "eventId", "occurredAt", "eventType", "aggregateType", "aggregateId",
		       "correlationId", "causationId", "actorId", "actorRole",
		       payload, explanation, "schemaVersion"
		FROM events
		WHERE "aggregateType" = $1 AND "aggregateId" = $2
		ORDER BY "occurredAt" ASC
	`

	return es.queryEvents(query, aggregateType, aggregateID)
}

// GetByCorrelation retrieves all events with the same correlation ID
func (es *EventStore) GetByCorrelation(correlationID string) ([]*events.Event, error) {
	query := `
		SELECT "eventId", "occurredAt", "eventType", "aggregateType", "aggregateId",
		       "correlationId", "causationId", "actorId", "actorRole",
		       payload, explanation, "schemaVersion"
		FROM events
		WHERE "correlationId" = $1
		ORDER BY "occurredAt" ASC
	`

	return es.queryEvents(query, correlationID)
}

// GetByTimeRange retrieves events within a time range
func (es *EventStore) GetByTimeRange(from, to time.Time) ([]*events.Event, error) {
	query := `
		SELECT "eventId", "occurredAt", "eventType", "aggregateType", "aggregateId",
		       "correlationId", "causationId", "actorId", "actorRole",
		       payload, explanation, "schemaVersion"
		FROM events
		WHERE "occurredAt" BETWEEN $1 AND $2
		ORDER BY "occurredAt" ASC
	`

	return es.queryEvents(query, from, to)
}

// GetByEventType retrieves all events of a specific type
func (es *EventStore) GetByEventType(eventType string) ([]*events.Event, error) {
	query := `
		SELECT "eventId", "occurredAt", "eventType", "aggregateType", "aggregateId",
		       "correlationId", "causationId", "actorId", "actorRole",
		       payload, explanation, "schemaVersion"
		FROM events
		WHERE "eventType" = $1
		ORDER BY "occurredAt" ASC
	`

	return es.queryEvents(query, eventType)
}

// GetAll retrieves all events (use with caution)
func (es *EventStore) GetAll() ([]*events.Event, error) {
	query := `
		SELECT "eventId", "occurredAt", "eventType", "aggregateType", "aggregateId",
		       "correlationId", "causationId", "actorId", "actorRole",
		       payload, explanation, "schemaVersion"
		FROM events
		ORDER BY "occurredAt" ASC
	`

	return es.queryEvents(query)
}

// queryEvents is a helper function to execute queries and scan results
func (es *EventStore) queryEvents(query string, args ...interface{}) ([]*events.Event, error) {
	rows, err := es.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query events: %w", err)
	}
	defer rows.Close()

	var result []*events.Event

	for rows.Next() {
		var (
			eventID       string
			occurredAt    time.Time
			eventType     string
			aggregateType string
			aggregateID   string
			correlationID string
			causationID   sql.NullString
			actorID       string
			actorRole     string
			payloadJSON   []byte
			explanation   sql.NullString
			schemaVersion int
		)

		err := rows.Scan(
			&eventID,
			&occurredAt,
			&eventType,
			&aggregateType,
			&aggregateID,
			&correlationID,
			&causationID,
			&actorID,
			&actorRole,
			&payloadJSON,
			&explanation,
			&schemaVersion,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan event row: %w", err)
		}

		// Unmarshal payload
		var payload map[string]interface{}
		if err := json.Unmarshal(payloadJSON, &payload); err != nil {
			return nil, fmt.Errorf("failed to unmarshal payload: %w", err)
		}

		event := &events.Event{
			EventID:   eventID,
			EventType: eventType,
			OccurredAt: occurredAt,
			Actor: events.Actor{
				ActorID: actorID,
				Role:    actorRole,
			},
			Aggregate: events.Aggregate{
				Type: aggregateType,
				ID:   aggregateID,
			},
			CorrelationID: correlationID,
			Payload:       payload,
			SchemaVersion: schemaVersion,
		}

		if causationID.Valid {
			event.CausationID = &causationID.String
		}

		if explanation.Valid {
			event.Explanation = &explanation.String
		}

		result = append(result, event)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating event rows: %w", err)
	}

	return result, nil
}
