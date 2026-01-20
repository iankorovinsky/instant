export function getDriftStatus(driftPercent: number): { status: string; color: string } {
  if (Math.abs(driftPercent) <= 5) return { status: "in_tolerance", color: "green" };
  if (Math.abs(driftPercent) <= 15) return { status: "warning", color: "yellow" };
  return { status: "out_of_tolerance", color: "red" };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDate(date: Date | string): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}
