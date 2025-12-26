"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  orders,
  getOrderSummary,
  getStateColor,
  getComplianceColor,
  formatOrderQuantity,
} from "@/lib/oms/mock-data";
import { accounts, households, formatDate } from "@/lib/pms/mock-data";

export default function OMSDashboardPage() {
  const router = useRouter();
  const summary = getOrderSummary();

  // Get recent orders (last 10)
  const recentOrders = [...orders]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  // Get orders requiring attention
  const pendingApproval = orders.filter((o) => o.state === "APPROVAL_PENDING");
  const blockedOrders = orders.filter(
    (o) => o.complianceResult?.status === "BLOCK" && o.state !== "REJECTED"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and track orders through the trade lifecycle
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/oms/upload">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
          <Button asChild>
            <Link href="/app/oms/create">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatOrderQuantity(summary.totalQuantity)} total quantity
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders?state=APPROVAL_PENDING")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.byState.APPROVAL_PENDING}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders?state=SENT")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Execution</CardTitle>
            <Send className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {summary.byState.SENT + summary.byState.PARTIALLY_FILLED}
            </div>
            <p className="text-xs text-muted-foreground">Sent to EMS</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders?state=FILLED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filled Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.byState.FILLED}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatOrderQuantity(summary.totalFilledQuantity)} filled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Order Blotter</p>
                <p className="text-sm text-muted-foreground">View all orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/create")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Create Order</p>
                <p className="text-sm text-muted-foreground">New single order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/upload")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Bulk Upload</p>
                <p className="text-sm text-muted-foreground">Upload CSV orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders?state=DRAFT")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">Drafts</p>
                <p className="text-sm text-muted-foreground">
                  {summary.byState.DRAFT} draft orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders Pending Approval */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Pending Approval
                </CardTitle>
                <CardDescription>{pendingApproval.length} orders awaiting review</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/oms/orders?state=APPROVAL_PENDING">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingApproval.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApproval.slice(0, 5).map((order) => (
                    <TableRow
                      key={order.orderId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/app/oms/orders/${order.orderId}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium font-mono text-sm">{order.cusip}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-32">
                            {order.instrumentDescription}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={order.side === "BUY" ? "text-green-600" : "text-red-600"}
                        >
                          {order.side}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatOrderQuantity(order.quantity)}</TableCell>
                      <TableCell>
                        {order.complianceResult && (
                          <Badge className={getComplianceColor(order.complianceResult.status)}>
                            {order.complianceResult.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No orders pending approval.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest order activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/oms/orders">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CUSIP</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow
                    key={order.orderId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/app/oms/orders/${order.orderId}`)}
                  >
                    <TableCell className="font-mono text-sm">{order.cusip}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={order.side === "BUY" ? "text-green-600" : "text-red-600"}
                      >
                        {order.side}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStateColor(order.state)}>
                        {order.state.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order State Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Overview</CardTitle>
          <CardDescription>Distribution of orders by lifecycle state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {(
              [
                { state: "DRAFT", label: "Draft", icon: FileText },
                { state: "APPROVAL_PENDING", label: "Pending", icon: Clock },
                { state: "APPROVED", label: "Approved", icon: CheckCircle },
                { state: "SENT", label: "Sent", icon: Send },
                { state: "FILLED", label: "Filled", icon: TrendingUp },
              ] as const
            ).map(({ state, label, icon: Icon }) => (
              <div
                key={state}
                className="text-center p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                onClick={() => router.push(`/app/oms/orders?state=${state}`)}
              >
                <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{summary.byState[state]}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
