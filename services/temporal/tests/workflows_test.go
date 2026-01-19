package tests

import (
	"testing"

	"instant/services/temporal/workflows"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.temporal.io/sdk/testsuite"
)

func Test_Workflow(t *testing.T) {
	testSuite := &testsuite.WorkflowTestSuite{}
	env := testSuite.NewTestWorkflowEnvironment()

	// Mock activity implementation using activity names (as strings)
	env.OnActivity("GetIP", mock.Anything).Return("1.1.1.1", nil)
	env.OnActivity("GetLocationInfo", mock.Anything, "1.1.1.1").Return("Planet Earth", nil)

	env.ExecuteWorkflow(workflows.GetAddressFromIP, "Temporal")

	var result string
	assert.NoError(t, env.GetWorkflowResult(&result))
	assert.Equal(t, "Hello, Temporal. Your IP is 1.1.1.1 and your location is Planet Earth", result)
}
