import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileText,
} from "lucide-react";

// Mock data - will be replaced with API calls later
const stats = [
  {
    label: "Total Households",
    value: "24",
    icon: Building2,
    change: "+2 this month",
  },
  {
    label: "Total Accounts",
    value: "47",
    icon: Wallet,
    change: "+5 this month",
  },
  {
    label: "Total AUM",
    value: "$127.4M",
    icon: DollarSign,
    change: "+3.2% MTD",
  },
  {
    label: "Pending Orders",
    value: "8",
    icon: Clock,
    change: "3 need approval",
  },
  {
    label: "Compliance Issues",
    value: "2",
    icon: AlertTriangle,
    change: "1 blocking",
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
  switch (status) {
    case "PENDING_APPROVAL":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Approved
        </Badge>
      );
    case "FILLED":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Filled
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          Rejected
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          Draft
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here&apos;s an overview of your practice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">As of:</span>
          <Badge variant="outline" className="text-sm">
            Dec 24, 2024
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/app/oms/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/pms/optimization">
            <TrendingUp className="w-4 h-4 mr-2" />
            Run Optimization
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/compliance">
            <Shield className="w-4 h-4 mr-2" />
            View Compliance
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/pms/accounts">
            <FileText className="w-4 h-4 mr-2" />
            Add Account
          </Link>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Last 5 orders across all accounts</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/oms/orders">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.cusip} • {order.side} {order.quantity.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.household} / {order.account}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Latest activity in your system</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/events/timeline">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-secondary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{event.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
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
