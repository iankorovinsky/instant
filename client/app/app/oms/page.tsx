"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  Send,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PendingOrdersTable,
  RecentOrdersTable,
} from "@/components/oms";
import {
  orders,
  getOrderSummary,
} from "@/lib/oms/mock-data";

export default function OMSDashboardPage() {
  const router = useRouter();
  const summary = getOrderSummary();

  // Get recent orders (sorted by most recent)
  const recentOrders = [...orders]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Get orders requiring attention
  const pendingApproval = orders.filter((o) => o.state === "APPROVAL_PENDING");

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/app/oms/orders">
              <FileText className="h-4 w-4" />
              View Order Blotter
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 shrink-0">
        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders?state=DRAFT")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Orders</CardTitle>
            <Edit className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {summary.byState.DRAFT}
            </div>
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
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders?state=SENT,PARTIALLY_FILLED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Execution</CardTitle>
            <Send className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {summary.byState.SENT + summary.byState.PARTIALLY_FILLED}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => router.push("/app/oms/orders?state=FILLED,SETTLED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.byState.FILLED}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2 flex-1 min-h-0 overflow-hidden">
        {/* Orders Pending Approval */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Pending Approval</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/oms/orders?state=APPROVAL_PENDING">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden p-0 px-6 pb-6">
            <PendingOrdersTable orders={pendingApproval} />
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/oms/orders">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden p-0 px-6 pb-6">
            <RecentOrdersTable orders={recentOrders} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
