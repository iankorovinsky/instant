"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Check,
  X,
  Send,
  Pencil,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Briefcase,
  Building2,
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
  getStateColor,
  getComplianceColor,
  formatOrderQuantity,
  formatPrice,
} from "@/lib/oms/ui";
import { formatDate } from "@/lib/pms/ui";
import { useApproveOrder, useCancelOrder, useOrder, useSendToEMS } from "@/lib/hooks/use-oms";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading, error } = useOrder(id);
  const approveMutation = useApproveOrder();
  const cancelMutation = useCancelOrder();
  const sendToEMSMutation = useSendToEMS();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/app/oms/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const canApprove =
    order.state === "APPROVAL_PENDING" && order.complianceResult?.status !== "BLOCK";
  const canCancel = !["FILLED", "SETTLED", "CANCELLED", "REJECTED"].includes(order.state);
  const canSendToEms = order.state === "APPROVED";

  const handleApprove = async () => {
    await approveMutation.mutateAsync({ orderId: order.orderId, approvedBy: "advisor@instant.com" });
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync({ orderId: order.orderId, cancelledBy: "advisor@instant.com" });
  };

  const handleSendToEms = async () => {
    await sendToEMSMutation.mutateAsync({ orderId: order.orderId, sentBy: "advisor@instant.com" });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "OrderCreated":
        return <FileText className="h-4 w-4 text-gray-600" />;
      case "OrderApprovalRequested":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "OrderApproved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "OrderRejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "OrderSentToEMS":
        return <Send className="h-4 w-4 text-cyan-600" />;
      case "OrderPartiallyFilled":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "OrderFullyFilled":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "OrderCancelled":
        return <X className="h-4 w-4 text-gray-600" />;
      case "OrderAmended":
        return <Pencil className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/oms/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight font-mono">
                    {order.orderId}
                  </h1>
                  <Badge className={getStateColor(order.state)}>
                    {order.state.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canCancel && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          {canApprove && (
            <Button
              variant="outline"
              className="text-green-600"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {canSendToEms && (
            <Button onClick={handleSendToEms} disabled={sendToEMSMutation.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Send to EMS
            </Button>
          )}
          {order.state === "SENT" && (
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              View in EMS
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Instrument</p>
                    <p className="font-mono font-medium">{order.cusip || order.instrumentId}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.instrumentName || order.instrumentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Side</p>
                    <Badge
                      variant="outline"
                      className={`text-lg ${
                        order.side === "BUY" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {order.side}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="text-2xl font-bold">
                      {formatOrderQuantity(order.quantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">par value</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Type</p>
                    <Badge variant="secondary" className="text-sm">
                      {order.orderType}
                    </Badge>
                  </div>
                  {order.orderType === "LIMIT" && order.limitPrice && (
                    <div>
                      <p className="text-sm text-muted-foreground">Limit Price</p>
                      <p className="text-xl font-bold">{formatPrice(order.limitPrice)}</p>
                    </div>
                  )}
                  {order.orderType === "CURVE_RELATIVE" && order.curveSpreadBp && (
                    <div>
                      <p className="text-sm text-muted-foreground">Curve Spread</p>
                      <p className="text-xl font-bold">+{order.curveSpreadBp} bp</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Time in Force</p>
                    <p className="font-medium">{order.timeInForce}</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Compliance Results */}
          {order.complianceResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {order.complianceResult.status === "PASS" && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {order.complianceResult.status === "WARN" && (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  {order.complianceResult.status === "BLOCK" && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Compliance Check
                  <Badge className={getComplianceColor(order.complianceResult.status)}>
                    {order.complianceResult.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Checked {formatDate(order.complianceResult.checkedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {order.complianceResult.warnings && order.complianceResult.warnings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-yellow-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings ({order.complianceResult.warnings.length})
                    </h4>
                    <div className="space-y-2">
                      {order.complianceResult.warnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{warning.ruleName}</span>
                            <Badge variant="outline">{warning.ruleId}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{warning.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.complianceResult.blocks && order.complianceResult.blocks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Blocks ({order.complianceResult.blocks.length})
                    </h4>
                    <div className="space-y-2">
                      {order.complianceResult.blocks.map((block, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{block.ruleName}</span>
                            <Badge variant="outline">{block.ruleId}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{block.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Timeline */}
          {order.events && order.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
                <CardDescription>Chronological history of order events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.events.map((event, idx) => (
                    <div key={event.eventId} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {getEventIcon(event.eventType)}
                        </div>
                        {idx < order.events!.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {event.eventType.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.occurredAt)}
                          </p>
                        </div>
                        {event.explanation && (
                          <p className="text-sm text-muted-foreground">{event.explanation}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          by {event.actor?.actorId || "system"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Context */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/app/pms/accounts/${order.accountId}`}
                className="flex items-center gap-3 hover:text-primary"
              >
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.accountName || order.accountId}</p>
                  <p className="text-sm text-muted-foreground">{order.householdId || "Unknown"}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Household Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Household</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/app/pms/households/${order.householdId}`}
                className="flex items-center gap-3 hover:text-primary"
              >
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{order.householdId || "Unknown"}</span>
              </Link>
            </CardContent>
          </Card>

          {/* Order Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{formatDate(order.updatedAt)}</span>
                </div>
                {order.sentToEmsAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sent to EMS</span>
                    <span className="font-medium">{formatDate(order.sentToEmsAt)}</span>
                  </div>
                )}
                {order.fullyFilledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filled</span>
                    <span className="font-medium">{formatDate(order.fullyFilledAt)}</span>
                  </div>
                )}
                {order.settledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settled</span>
                    <span className="font-medium">{formatDate(order.settledAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Batch Info */}
          {order.batchId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Batch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">{order.batchId}</p>
                <Button variant="link" className="p-0 h-auto mt-2" asChild>
                  <Link href={`/app/oms/orders?batchId=${order.batchId}`}>
                    View all batch orders
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
