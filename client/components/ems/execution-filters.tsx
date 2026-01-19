"use client";

import {
  SlidersHorizontal,
  Clock,
  Loader2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Timer,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ExecutionState } from "@/lib/ems/types";
import type { ExecutionFilters as FiltersState } from "./use-execution-filters";

interface StatusOption {
  value: ExecutionState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "PENDING",
    label: "Pending",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
  },
  {
    value: "SIMULATING",
    label: "Simulating",
    icon: Loader2,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
  },
  {
    value: "PARTIALLY_FILLED",
    label: "Partial",
    icon: TrendingUp,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20",
  },
  {
    value: "FILLED",
    label: "Filled",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
  },
  {
    value: "SETTLED",
    label: "Settled",
    icon: CheckCircle2,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    icon: XCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/20",
  },
];

interface SideOption {
  value: "BUY" | "SELL";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const SIDE_OPTIONS: SideOption[] = [
  {
    value: "BUY",
    label: "Buy",
    icon: ArrowUpRight,
    color: "text-green-600",
    bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
  },
  {
    value: "SELL",
    label: "Sell",
    icon: ArrowDownRight,
    color: "text-red-600",
    bgColor: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
  },
];

interface OrderTypeOption {
  value: "MARKET" | "LIMIT" | "CURVE_RELATIVE";
  label: string;
  description: string;
}

const ORDER_TYPE_OPTIONS: OrderTypeOption[] = [
  { value: "MARKET", label: "Market", description: "Execute at market price" },
  { value: "LIMIT", label: "Limit", description: "Execute at specified price" },
  { value: "CURVE_RELATIVE", label: "Curve Relative", description: "Spread to curve" },
];

const BUCKET_OPTIONS = [
  { value: "0-2y", label: "0-2y", description: "Short term" },
  { value: "2-5y", label: "2-5y", description: "Medium term" },
  { value: "5-10y", label: "5-10y", description: "Intermediate" },
  { value: "10-20y", label: "10-20y", description: "Long term" },
  { value: "20y+", label: "20y+", description: "Ultra long" },
];

interface ExecutionFiltersProps {
  filters: FiltersState;
  accounts: string[];
  activeFilterCount: number;
  onToggleStatus: (status: ExecutionState) => void;
  onToggleSide: (side: "BUY" | "SELL") => void;
  onToggleOrderType: (type: "MARKET" | "LIMIT" | "CURVE_RELATIVE") => void;
  onToggleAccount: (account: string) => void;
  onToggleBucket: (bucket: string) => void;
  onClearAll: () => void;
}

export function ExecutionFilters({
  filters,
  accounts,
  activeFilterCount,
  onToggleStatus,
  onToggleSide,
  onToggleOrderType,
  onToggleAccount,
  onToggleBucket,
  onClearAll,
}: ExecutionFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="h-9 w-9 relative">
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[440px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Filters</SheetTitle>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Status Filter */}
            <FilterSection
              title="Status"
              icon={Clock}
              count={filters.selectedStatuses.size}
            >
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = filters.selectedStatuses.has(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => onToggleStatus(option.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left",
                        isSelected
                          ? `${option.bgColor} border-current ${option.color}`
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isSelected ? option.color : "text-muted-foreground")} />
                      <span className={cn("text-sm font-medium", isSelected ? option.color : "")}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <Separator />

            {/* Side Filter */}
            <FilterSection
              title="Side"
              icon={TrendingUp}
              count={filters.selectedSides.size}
            >
              <div className="flex gap-3">
                {SIDE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = filters.selectedSides.has(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => onToggleSide(option.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
                        isSelected
                          ? `${option.bgColor} border-current ${option.color}`
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isSelected ? option.color : "text-muted-foreground")} />
                      <span className={cn("text-sm font-medium", isSelected ? option.color : "")}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <Separator />

            {/* Order Type Filter */}
            <FilterSection
              title="Order Type"
              icon={Landmark}
              count={filters.selectedOrderTypes.size}
            >
              <div className="space-y-2">
                {ORDER_TYPE_OPTIONS.map((option) => {
                  const isSelected = filters.selectedOrderTypes.has(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => onToggleOrderType(option.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left",
                        isSelected
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div>
                        <div className={cn("text-sm font-medium", isSelected ? "text-primary" : "")}>
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <Separator />

            {/* Maturity Bucket Filter */}
            <FilterSection
              title="Maturity Bucket"
              icon={Timer}
              count={filters.selectedBuckets.size}
            >
              <div className="flex flex-wrap gap-2">
                {BUCKET_OPTIONS.map((option) => {
                  const isSelected = filters.selectedBuckets.has(option.value);
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 text-sm transition-all",
                        isSelected
                          ? "bg-primary hover:bg-primary/90"
                          : "hover:bg-muted"
                      )}
                      onClick={() => onToggleBucket(option.value)}
                    >
                      {option.label}
                    </Badge>
                  );
                })}
              </div>
            </FilterSection>

            {/* Account Filter */}
            {accounts.length > 0 && (
              <>
                <Separator />
                <FilterSection
                  title="Account"
                  icon={User}
                  count={filters.selectedAccounts.size}
                >
                  <div className="space-y-1">
                    {accounts.map((account) => {
                      const isSelected = filters.selectedAccounts.has(account);
                      return (
                        <button
                          key={account}
                          onClick={() => onToggleAccount(account)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <span className={cn("text-sm", isSelected ? "font-medium" : "")}>
                            {account}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface FilterSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}

function FilterSection({ title, icon: Icon, count, children }: FilterSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">{title}</h4>
        {count > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}
