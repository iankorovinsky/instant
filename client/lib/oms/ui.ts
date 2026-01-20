import type { OrderState } from "@/lib/api/oms";

type ComplianceStatus = "PASS" | "WARN" | "BLOCK";

export function formatOrderQuantity(quantity: number): string {
  if (quantity >= 1000000) {
    return `${(quantity / 1000000).toFixed(1)}M`;
  }
  if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(0)}K`;
  }
  return quantity.toString();
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export function getStateColor(state: OrderState): string {
  switch (state) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "APPROVAL_PENDING":
      return "bg-blue-100 text-blue-800";
    case "APPROVED":
      return "bg-indigo-100 text-indigo-800";
    case "SENT":
      return "bg-cyan-100 text-cyan-800";
    case "PARTIALLY_FILLED":
      return "bg-amber-100 text-amber-800";
    case "FILLED":
      return "bg-green-100 text-green-800";
    case "SETTLED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getComplianceColor(status: ComplianceStatus): string {
  switch (status) {
    case "PASS":
      return "bg-green-100 text-green-800";
    case "WARN":
      return "bg-yellow-100 text-yellow-800";
    case "BLOCK":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
