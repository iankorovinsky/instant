/**
 * Copilot React Hook
 *
 * Provides React Query hooks for interacting with the AI Copilot.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  proposeCommands,
  executeCommands,
  getSystemContext,
  checkCopilotHealth,
  storeAIDraftProposed,
  storeAIDraftApproved,
  storeAIDraftRejected,
  type CommandPlan,
  type ProposeRequest,
  type ExecuteRequest,
  type ExecutionResult,
  type SystemContext,
} from "@/lib/api/copilot";
import { useCallback, useState } from "react";

// Query keys
export const copilotKeys = {
  all: ["copilot"] as const,
  health: () => [...copilotKeys.all, "health"] as const,
  context: () => [...copilotKeys.all, "context"] as const,
  plans: () => [...copilotKeys.all, "plans"] as const,
};

/**
 * Hook to check copilot service health
 */
export function useCopilotHealth() {
  return useQuery({
    queryKey: copilotKeys.health(),
    queryFn: checkCopilotHealth,
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });
}

/**
 * Hook to get system context
 */
export function useSystemContext() {
  return useQuery({
    queryKey: copilotKeys.context(),
    queryFn: getSystemContext,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to propose commands from natural language
 */
export function usePropose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ProposeRequest) => {
      const plan = await proposeCommands(request);
      // Store the AIDraftProposed event
      await storeAIDraftProposed(plan.planId, plan, request.userId || "user");
      return plan;
    },
    onSuccess: () => {
      // Invalidate context to get fresh data
      queryClient.invalidateQueries({ queryKey: copilotKeys.context() });
    },
  });
}

/**
 * Hook to execute an approved command plan
 */
export function useExecute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ExecuteRequest) => {
      // Store the AIDraftApproved event before executing
      await storeAIDraftApproved(request.planId, request.userId);
      const result = await executeCommands(request);
      return result;
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data after execution
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook to reject a command plan
 */
export function useRejectPlan() {
  return useMutation({
    mutationFn: async ({
      planId,
      userId,
      reason,
    }: {
      planId: string;
      userId: string;
      reason?: string;
    }) => {
      await storeAIDraftRejected(planId, userId, reason);
    },
  });
}

/**
 * Combined hook for full copilot workflow
 */
export function useCopilot(userId: string = "user") {
  const [currentPlan, setCurrentPlan] = useState<CommandPlan | null>(null);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);

  const proposeMutation = usePropose();
  const executeMutation = useExecute();
  const rejectMutation = useRejectPlan();
  const healthQuery = useCopilotHealth();

  const propose = useCallback(
    async (query: string, context?: ProposeRequest["context"]) => {
      setLastResult(null);
      const plan = await proposeMutation.mutateAsync({
        query,
        context,
        userId,
      });
      setCurrentPlan(plan);
      return plan;
    },
    [proposeMutation, userId]
  );

  const execute = useCallback(async () => {
    if (!currentPlan) {
      throw new Error("No plan to execute");
    }
    const result = await executeMutation.mutateAsync({
      planId: currentPlan.planId,
      commands: currentPlan.commands,
      userId,
    });
    setLastResult(result);
    setCurrentPlan(null);
    return result;
  }, [currentPlan, executeMutation, userId]);

  const reject = useCallback(
    async (reason?: string) => {
      if (!currentPlan) {
        return;
      }
      await rejectMutation.mutateAsync({
        planId: currentPlan.planId,
        userId,
        reason,
      });
      setCurrentPlan(null);
    },
    [currentPlan, rejectMutation, userId]
  );

  const clear = useCallback(() => {
    setCurrentPlan(null);
    setLastResult(null);
  }, []);

  return {
    // State
    currentPlan,
    lastResult,
    isHealthy: healthQuery.data ?? false,

    // Loading states
    isProposing: proposeMutation.isPending,
    isExecuting: executeMutation.isPending,
    isRejecting: rejectMutation.isPending,

    // Errors
    proposeError: proposeMutation.error,
    executeError: executeMutation.error,

    // Actions
    propose,
    execute,
    reject,
    clear,
  };
}
