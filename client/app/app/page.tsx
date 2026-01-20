import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Building2,
  Wallet,
  DollarSign,
  Clock,
  AlertTriangle,
  Plus,
  TrendingUp,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

// Mock data - will be replaced with API calls later
const stats = [
  {
    label: "Total Households",
    value: "24",
    icon: Building2,
    change: "+2",
    changeLabel: "this month",
    trend: "up",
  },
  {
    label: "Total Accounts",
    value: "47",
    icon: Wallet,
    change: "+5",
    changeLabel: "this month",
    trend: "up",
  },
  {
    label: "Total AUM",
    value: "$127.4M",
    icon: DollarSign,
    change: "+3.2%",
    changeLabel: "MTD",
    trend: "up",
  },
  {
    label: "Pending Orders",
    value: "8",
    icon: Clock,
    change: "3",
    changeLabel: "need approval",
    trend: "neutral",
  },
  {
    label: "Compliance Issues",
    value: "2",
    icon: AlertTriangle,
    change: "1",
    changeLabel: "blocking",
    trend: "down",
  },
];

const recentOrders = [
  {
    id: "ORD-001",
    cusip: "912828ZT6",
    side: "BUY",
    quantity: 100000,
    status: "PENDING_APPROVAL",
    household: "Smith Family",
    account: "Smith IRA",
  },
  {
    id: "ORD-002",
    cusip: "912828YG4",
    side: "SELL",
    quantity: 50000,
    status: "APPROVED",
    household: "Johnson Trust",
    account: "Johnson Main",
  },
  {
    id: "ORD-003",
    cusip: "912828XB6",
    side: "BUY",
    quantity: 75000,
    status: "FILLED",
    household: "Williams Corp",
    account: "Williams 401k",
  },
  {
    id: "ORD-004",
    cusip: "912828WC6",
    side: "BUY",
    quantity: 200000,
    status: "REJECTED",
    household: "Brown Estate",
    account: "Brown Trust",
  },
  {
    id: "ORD-005",
    cusip: "912828VE2",
    side: "SELL",
    quantity: 25000,
    status: "DRAFT",
    household: "Davis Family",
    account: "Davis Joint",
  },
];

const recentEvents = [
  {
    type: "OrderCreated",
    description: "New order ORD-006 created for Smith IRA",
    timestamp: "2 minutes ago",
  },
  {
    type: "ComplianceEvaluated",
    description: "Compliance check passed for ORD-005",
    timestamp: "15 minutes ago",
  },
  {
    type: "OrderFilled",
    description: "ORD-003 filled at $99.125",
    timestamp: "1 hour ago",
  },
  {
    type: "ProposalApproved",
    description: "Optimization proposal for Johnson Trust approved",
    timestamp: "2 hours ago",
  },
  {
    type: "RuleUpdated",
    description: "Duration limit rule updated for all accounts",
    timestamp: "3 hours ago",
  },
];

function getStatusBadge(status: string) {
  const variants: Record<string, { className: string; label: string }> = {
    PENDING_APPROVAL: {
      className: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Pending",
    },
    APPROVED: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Approved",
    },
    FILLED: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Filled",
    },
    REJECTED: {
      className: "bg-red-50 text-red-700 border-red-200",
      label: "Rejected",
    },
    DRAFT: {
      className: "bg-slate-50 text-slate-700 border-slate-200",
      label: "Draft",
    },
  };

  const variant = variants[status] || {
    className: "bg-slate-50 text-slate-700",
    label: status,
  };

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

function getTrendIcon(trend: string) {
  if (trend === "up") {
    return <ArrowUpRight className="h-3 w-3 text-emerald-600" />;
  }
  if (trend === "down") {
    return <ArrowDownRight className="h-3 w-3 text-red-600" />;
  }
  return null;
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here&apos;s an overview of your practice.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                {stat.trend !== "neutral" && (
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {getTrendIcon(stat.trend)}
                    <span
                      className={
                        stat.trend === "up"
                          ? "text-emerald-600"
                          : stat.trend === "down"
                            ? "text-red-600"
                            : "text-muted-foreground"
                      }
                    >
                      {stat.change}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stat.trend === "neutral" ? `${stat.change} ` : ""}
                {stat.changeLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href="/app/oms/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/app/pms/optimization">
            <TrendingUp className="mr-2 h-4 w-4" />
            Run Optimization
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/app/compliance">
            <Shield className="mr-2 h-4 w-4" />
            View Compliance
          </Link>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Orders
                </CardTitle>
                <CardDescription>
                  Last 5 orders across all accounts
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/oms/orders">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{order.id}</span>
                      <Badge
                        variant="outline"
                        className={
                          order.side === "BUY"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }
                      >
                        {order.side}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {order.cusip} &middot; {order.quantity.toLocaleString()}{" "}
                      units
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.household} / {order.account}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Events
                </CardTitle>
                <CardDescription>Latest activity in your system</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/events/timeline">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{event.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
