import type { ExecutionState } from "./types";

export function getStateColor(status: ExecutionState): string {
  switch (status) {
    case "PENDING":
      return "bg-gray-100 text-gray-800";
    case "SIMULATING":
      return "bg-blue-100 text-blue-800";
    case "PARTIALLY_FILLED":
      return "bg-amber-100 text-amber-800";
    case "FILLED":
      return "bg-green-100 text-green-800";
    case "SETTLED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
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

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
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

export function formatPrice(value: number): string {
  return value.toFixed(3);
}

export function formatBasisPoints(value: number): string {
  return `${value.toFixed(2)} bp`;
}
