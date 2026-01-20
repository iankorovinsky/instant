"use client";

import {
  SlidersHorizontal,
  Clock,
  FileEdit,
  CheckCircle2,
  Send,
  TrendingUp,
  XCircle,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Users,
  Shield,
  AlertTriangle,
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
import type { OrderState, OrderType } from "@/lib/api/oms";
import type { OrderFilters as FiltersState } from "./use-order-filters";

interface StateOption {
  value: OrderState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const STATE_OPTIONS: StateOption[] = [
  {
    value: "DRAFT",
    label: "Draft",
    icon: FileEdit,
    color: "text-gray-600",
    bgColor: "bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/20",
  },
  {
    value: "APPROVAL_PENDING",
    label: "Pending",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
  },
  {
    value: "APPROVED",
    label: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
  },
  {
    value: "SENT",
    label: "Sent",
    icon: Send,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20",
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
  {
    value: "REJECTED",
    label: "Rejected",
    icon: Ban,
    color: "text-red-600",
    bgColor: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
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

interface ComplianceOption {
  value: "PASS" | "WARN" | "BLOCK";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const COMPLIANCE_OPTIONS: ComplianceOption[] = [
  {
    value: "PASS",
    label: "Pass",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
  },
  {
    value: "WARN",
    label: "Warning",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20",
  },
  {
    value: "BLOCK",
    label: "Block",
    icon: Ban,
    color: "text-red-600",
    bgColor: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
  },
];

interface OrderTypeOption {
  value: OrderType;
  label: string;
  description: string;
}

const ORDER_TYPE_OPTIONS: OrderTypeOption[] = [
  { value: "MARKET", label: "Market", description: "Execute at market price" },
  { value: "LIMIT", label: "Limit", description: "Execute at specified price" },
  { value: "CURVE_RELATIVE", label: "Curve Relative", description: "Spread to curve" },
];

interface OrderFiltersProps {
  households: Array<{ householdId: string; name: string }>;
  filters: FiltersState;
  activeFilterCount: number;
  onToggleState: (state: OrderState) => void;
  onToggleSide: (side: "BUY" | "SELL") => void;
  onToggleOrderType: (type: OrderType) => void;
  onToggleHousehold: (householdId: string) => void;
  onToggleCompliance: (status: "PASS" | "WARN" | "BLOCK") => void;
  onClearAll: () => void;
}

export function OrderFilters({
  households,
  filters,
  activeFilterCount,
  onToggleState,
  onToggleSide,
  onToggleOrderType,
  onToggleHousehold,
  onToggleCompliance,
  onClearAll,
}: OrderFiltersProps) {
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
            {/* Order State Filter */}
            <FilterSection
              title="Order State"
              icon={Clock}
              count={filters.selectedStates.size}
            >
              <div className="grid grid-cols-3 gap-2">
                {STATE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = filters.selectedStates.has(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => onToggleState(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-center",
                        isSelected
                          ? `${option.bgColor} border-current ${option.color}`
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isSelected ? option.color : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", isSelected ? option.color : "")}>
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

            {/* Compliance Status Filter */}
            <FilterSection
              title="Compliance"
              icon={Shield}
              count={filters.selectedCompliance.size}
            >
              <div className="flex gap-2">
                {COMPLIANCE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = filters.selectedCompliance.has(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => onToggleCompliance(option.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all",
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

            {/* Household Filter */}
            <FilterSection
              title="Household"
              icon={Users}
              count={filters.selectedHouseholds.size}
            >
              <div className="space-y-1">
                {households.map((household) => {
                  const isSelected = filters.selectedHouseholds.has(household.householdId);
                  return (
                    <button
                      key={household.householdId}
                      onClick={() => onToggleHousehold(household.householdId)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span className={cn("text-sm", isSelected ? "font-medium" : "")}>
                        {household.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </FilterSection>
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
