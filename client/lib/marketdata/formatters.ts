import type { InstrumentType, MaturityBucket } from "@/lib/marketdata/types";

export function getTypeColor(type: InstrumentType): string {
  switch (type) {
    case "bill":
      return "bg-blue-100 text-blue-800";
    case "note":
      return "bg-green-100 text-green-800";
    case "bond":
      return "bg-purple-100 text-purple-800";
    case "tips":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getBucketColor(bucket: MaturityBucket): string {
  switch (bucket) {
    case "0-2y":
      return "bg-blue-100 text-blue-800";
    case "2-5y":
      return "bg-green-100 text-green-800";
    case "5-10y":
      return "bg-yellow-100 text-yellow-800";
    case "10-20y":
      return "bg-orange-100 text-orange-800";
    case "20y+":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPrice(value: number): string {
  return value.toFixed(4);
}

export function formatYield(value: number): string {
  return `${value.toFixed(3)}%`;
}

export function formatDuration(value: number): string {
  return `${value.toFixed(2)}y`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return formatCurrency(value);
}
