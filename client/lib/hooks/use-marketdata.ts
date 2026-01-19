import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as marketdataApi from "@/lib/marketdata/api";

export function useCurveDates() {
  return useQuery({
    queryKey: ["marketdata", "curve-dates"],
    queryFn: () => marketdataApi.fetchCurveDates(),
    staleTime: 60 * 1000,
  });
}

export function useYieldCurve(asOfDate?: Date) {
  return useQuery({
    queryKey: ["marketdata", "curve", asOfDate?.toISOString()],
    queryFn: () => marketdataApi.fetchYieldCurve(asOfDate),
    enabled: !!asOfDate,
  });
}

export function useInstruments(params: {
  asOfDate?: Date;
  types?: string[];
  buckets?: string[];
  maturityFrom?: string;
  maturityTo?: string;
  couponMin?: number;
  couponMax?: number;
  cusip?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["marketdata", "instruments", params],
    queryFn: () => marketdataApi.fetchInstruments(params),
    enabled: !!params.asOfDate,
  });
}

export function useMarketGrid(params: {
  asOfDate?: Date;
  types?: string[];
  buckets?: string[];
  maturityFrom?: string;
  maturityTo?: string;
  couponMin?: number;
  couponMax?: number;
  cusip?: string;
}) {
  return useQuery({
    queryKey: ["marketdata", "market-grid", params],
    queryFn: () => marketdataApi.fetchMarketGrid(params),
    enabled: !!params.asOfDate,
  });
}

export function useInstrumentDetail(cusip: string, asOfDate?: Date) {
  return useQuery({
    queryKey: ["marketdata", "instrument", cusip, asOfDate?.toISOString()],
    queryFn: () => marketdataApi.fetchInstrumentDetail(cusip, asOfDate),
    enabled: !!cusip && !!asOfDate,
  });
}

export function usePricingHistory(cusip: string, limit = 10) {
  return useQuery({
    queryKey: ["marketdata", "pricing-history", cusip, limit],
    queryFn: () => marketdataApi.fetchPricingHistory(cusip, limit),
    enabled: !!cusip,
  });
}

export function useMarketDataSummary() {
  return useQuery({
    queryKey: ["marketdata", "summary"],
    queryFn: () => marketdataApi.fetchMarketDataSummary(),
    staleTime: 60 * 1000,
  });
}

export function useRefreshMarketData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ["marketdata"] });
      return true;
    },
  });
}
