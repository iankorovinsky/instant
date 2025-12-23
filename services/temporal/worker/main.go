package main

import (
	"log"
	"net/http"

	"instant/services/temporal"
	"instant/services/temporal/activities"
	"instant/services/temporal/workflows"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

func main() {
	// Create the Temporal client
	c, err := client.Dial(client.Options{})
	if err != nil {
		log.Fatalln("Unable to create Temporal client", err)
	}
	defer c.Close()

	// Create the Temporal worker
	w := worker.New(c, temporal.TaskQueueName, worker.Options{})

	// inject HTTP client into the Activities Struct
	ipActivities := &activities.IPActivities{
		HTTPClient: http.DefaultClient,
	}

	// Register Workflow and Activities
	w.RegisterWorkflow(workflows.GetAddressFromIP)
	w.RegisterActivity(ipActivities)

	// Start the Worker
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start Temporal worker", err)
	}
}
