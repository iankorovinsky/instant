/**
 * React Query hooks for OMS operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as omsApi from '@/lib/api/oms';
import type {
  CreateOrderRequest,
  AmendOrderRequest,
  BlotterFilters,
} from '@/lib/api/oms';

/**
 * Hook to fetch blotter (list of orders)
 */
export function useBlotter(filters?: BlotterFilters) {
  return useQuery({
    queryKey: ['blotter', filters],
    queryFn: () => omsApi.getBlotter(filters),
    staleTime: 5000, // Consider data fresh for 5 seconds
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => omsApi.getOrderById(orderId),
    enabled: !!orderId,
  });
}

/**
 * Hook to fetch orders by batch ID
 */
export function useBatchOrders(batchId: string) {
  return useQuery({
    queryKey: ['batch-orders', batchId],
    queryFn: () => omsApi.getOrdersByBatchId(batchId),
    enabled: !!batchId,
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateOrderRequest) => omsApi.createOrder(request),
    onSuccess: () => {
      // Invalidate blotter to refetch orders
      queryClient.invalidateQueries({ queryKey: ['blotter'] });
    },
  });
}

/**
 * Hook to amend an order
 */
export function useAmendOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, request }: { orderId: string; request: AmendOrderRequest }) =>
      omsApi.amendOrder(orderId, request),
    onSuccess: (_, variables) => {
      // Invalidate specific order and blotter
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['blotter'] });
    },
  });
}

/**
 * Hook to approve an order
 */
export function useApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, approvedBy }: { orderId: string; approvedBy: string }) =>
      omsApi.approveOrder(orderId, approvedBy),
    onSuccess: (_, variables) => {
      // Invalidate specific order and blotter
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['blotter'] });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, cancelledBy, reason }: { orderId: string; cancelledBy: string; reason?: string }) =>
      omsApi.cancelOrder(orderId, cancelledBy, reason),
    onSuccess: (_, variables) => {
      // Invalidate specific order and blotter
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['blotter'] });
    },
  });
}

/**
 * Hook to send an order to EMS
 */
export function useSendToEMS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, sentBy }: { orderId: string; sentBy: string }) =>
      omsApi.sendToEMS(orderId, sentBy),
    onSuccess: (_, variables) => {
      // Invalidate specific order and blotter
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['blotter'] });
    },
  });
}

/**
 * Hook to bulk create orders
 */
export function useBulkCreateOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orders, createdBy }: { orders: CreateOrderRequest[]; createdBy: string }) =>
      omsApi.bulkCreateOrders(orders, createdBy),
    onSuccess: () => {
      // Invalidate blotter to refetch orders
      queryClient.invalidateQueries({ queryKey: ['blotter'] });
    },
  });
}
