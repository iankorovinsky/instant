package eventbus

import (
	"instant/services/api/events"
	"sync"
)

// Subscriber is a channel that receives events
type Subscriber chan *events.Event

// EventBus handles in-process event publishing and subscription
type EventBus struct {
	subscribers map[string][]Subscriber
	mu          sync.RWMutex
}

// New creates a new EventBus instance
func New() *EventBus {
	return &EventBus{
		subscribers: make(map[string][]Subscriber),
	}
}

// Publish sends an event to all subscribers of that event type
func (eb *EventBus) Publish(event *events.Event) {
	eb.mu.RLock()
	defer eb.mu.RUnlock()

	// Send to subscribers of this specific event type
	if subs, ok := eb.subscribers[event.EventType]; ok {
		for _, sub := range subs {
			// Non-blocking send to prevent slow subscribers from blocking
			select {
			case sub <- event:
			default:
				// Channel full, skip this subscriber
			}
		}
	}

	// Send to subscribers of all events (wildcard "*")
	if subs, ok := eb.subscribers["*"]; ok {
		for _, sub := range subs {
			select {
			case sub <- event:
			default:
				// Channel full, skip this subscriber
			}
		}
	}
}

// Subscribe creates a subscription to a specific event type
// Use "*" as eventType to subscribe to all events
// Returns a channel that will receive events and a cleanup function
func (eb *EventBus) Subscribe(eventType string, bufferSize int) (Subscriber, func()) {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	// Create subscriber channel with buffer
	if bufferSize <= 0 {
		bufferSize = 100 // Default buffer size
	}
	sub := make(Subscriber, bufferSize)

	// Add to subscribers list
	eb.subscribers[eventType] = append(eb.subscribers[eventType], sub)

	// Return cleanup function
	cleanup := func() {
		eb.Unsubscribe(eventType, sub)
	}

	return sub, cleanup
}

// Unsubscribe removes a subscriber from an event type
func (eb *EventBus) Unsubscribe(eventType string, sub Subscriber) {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	subs := eb.subscribers[eventType]
	for i, s := range subs {
		if s == sub {
			// Remove subscriber from slice
			eb.subscribers[eventType] = append(subs[:i], subs[i+1:]...)
			close(sub)
			break
		}
	}
}

// SubscriberCount returns the number of subscribers for an event type
func (eb *EventBus) SubscriberCount(eventType string) int {
	eb.mu.RLock()
	defer eb.mu.RUnlock()
	return len(eb.subscribers[eventType])
}

// Close closes all subscriber channels
func (eb *EventBus) Close() {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	for eventType, subs := range eb.subscribers {
		for _, sub := range subs {
			close(sub)
		}
		delete(eb.subscribers, eventType)
	}
}
