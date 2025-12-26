"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { accounts, households } from "@/lib/pms/mock-data";
import { instruments } from "@/lib/oms/mock-data";
import type { OrderSide, OrderType, TimeInForce } from "@/lib/oms/types";

export default function CreateOrderPage() {
  const router = useRouter();

  const [accountId, setAccountId] = useState<string>("");
  const [cusip, setCusip] = useState<string>("");
  const [instrumentSearch, setInstrumentSearch] = useState<string>("");
  const [side, setSide] = useState<OrderSide>("BUY");
  const [quantity, setQuantity] = useState<string>("");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [curveSpreadBp, setCurveSpreadBp] = useState<string>("");
  const [timeInForce, setTimeInForce] = useState<TimeInForce>("DAY");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = accounts.find((a) => a.accountId === accountId);
  const selectedHousehold = selectedAccount
    ? households.find((h) => h.householdId === selectedAccount.householdId)
    : null;
  const selectedInstrument = instruments.find((i) => i.cusip === cusip);

  const filteredInstruments = instruments.filter(
    (i) =>
      i.cusip.toLowerCase().includes(instrumentSearch.toLowerCase()) ||
      i.description.toLowerCase().includes(instrumentSearch.toLowerCase())
  );

  const isValid =
    accountId &&
    cusip &&
    quantity &&
    parseFloat(quantity) > 0 &&
    (orderType !== "LIMIT" || (limitPrice && parseFloat(limitPrice) > 0)) &&
    (orderType !== "CURVE_RELATIVE" || curveSpreadBp);

  const handleSaveAsDraft = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/app/oms/orders");
    }, 1000);
  };

  const handleSubmitForApproval = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/app/oms/orders");
    }, 1500);
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
            <h1 className="text-2xl font-bold tracking-tight">Create Order</h1>
            <p className="text-sm text-muted-foreground">
              Create a new single order
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/oms/orders">Cancel</Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={!isValid || isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={handleSubmitForApproval} disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Select the account for this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const hh = households.find((h) => h.householdId === account.householdId);
                    return (
                      <SelectItem key={account.accountId} value={account.accountId}>
                        <div className="flex items-center gap-2">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground">({hh?.name})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Instrument Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Instrument</CardTitle>
              <CardDescription>Search and select the instrument</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by CUSIP or description..."
                  value={instrumentSearch}
                  onChange={(e) => setInstrumentSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {instrumentSearch && !cusip && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredInstruments.map((inst) => (
                    <div
                      key={inst.cusip}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setCusip(inst.cusip);
                        setInstrumentSearch("");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium">{inst.cusip}</span>
                        <Badge variant="secondary">{inst.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{inst.description}</p>
                    </div>
                  ))}
                  {filteredInstruments.length === 0 && (
                    <div className="p-3 text-center text-muted-foreground">
                      No instruments found
                    </div>
                  )}
                </div>
              )}

              {selectedInstrument && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-medium text-lg">
                      {selectedInstrument.cusip}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCusip("")}
                    >
                      Change
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{selectedInstrument.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {selectedInstrument.type}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Specify the order parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Side */}
              <div className="space-y-2">
                <Label>Side</Label>
                <RadioGroup
                  value={side}
                  onValueChange={(v) => setSide(v as OrderSide)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BUY" id="buy" />
                    <Label
                      htmlFor="buy"
                      className={`cursor-pointer ${
                        side === "BUY" ? "text-green-600 font-medium" : ""
                      }`}
                    >
                      BUY
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SELL" id="sell" />
                    <Label
                      htmlFor="sell"
                      className={`cursor-pointer ${
                        side === "SELL" ? "text-red-600 font-medium" : ""
                      }`}
                    >
                      SELL
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (Par Value)</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity..."
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <Separator />

              {/* Order Type */}
              <div className="space-y-2">
                <Label>Order Type</Label>
                <RadioGroup
                  value={orderType}
                  onValueChange={(v) => setOrderType(v as OrderType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MARKET" id="market" />
                    <Label htmlFor="market" className="cursor-pointer">
                      Market
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LIMIT" id="limit" />
                    <Label htmlFor="limit" className="cursor-pointer">
                      Limit
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CURVE_RELATIVE" id="curve" />
                    <Label htmlFor="curve" className="cursor-pointer">
                      Curve Relative
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Limit Price (conditional) */}
              {orderType === "LIMIT" && (
                <div className="space-y-2">
                  <Label htmlFor="limitPrice">Limit Price</Label>
                  <Input
                    id="limitPrice"
                    type="number"
                    step="0.01"
                    placeholder="Enter limit price..."
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                  />
                </div>
              )}

              {/* Curve Spread (conditional) */}
              {orderType === "CURVE_RELATIVE" && (
                <div className="space-y-2">
                  <Label htmlFor="curveSpread">Curve Spread (Basis Points)</Label>
                  <Input
                    id="curveSpread"
                    type="number"
                    placeholder="Enter spread in basis points..."
                    value={curveSpreadBp}
                    onChange={(e) => setCurveSpreadBp(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Spread over the benchmark curve in basis points
                  </p>
                </div>
              )}

              <Separator />

              {/* Time in Force */}
              <div className="space-y-2">
                <Label>Time in Force</Label>
                <Select value={timeInForce} onValueChange={(v) => setTimeInForce(v as TimeInForce)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">DAY</SelectItem>
                    <SelectItem value="IOC">IOC (Immediate or Cancel)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <p className="font-medium">
                    {selectedAccount?.name || "Not selected"}
                  </p>
                  {selectedHousehold && (
                    <p className="text-sm text-muted-foreground">
                      {selectedHousehold.name}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Instrument</p>
                  {selectedInstrument ? (
                    <>
                      <p className="font-mono font-medium">{selectedInstrument.cusip}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedInstrument.description}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Not selected</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Side</span>
                  <Badge
                    variant="outline"
                    className={side === "BUY" ? "text-green-600" : "text-red-600"}
                  >
                    {side}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">
                    {quantity ? parseInt(quantity).toLocaleString() : "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Type</span>
                  <Badge variant="secondary">{orderType}</Badge>
                </div>

                {orderType === "LIMIT" && limitPrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limit Price</span>
                    <span className="font-medium">{parseFloat(limitPrice).toFixed(2)}</span>
                  </div>
                )}

                {orderType === "CURVE_RELATIVE" && curveSpreadBp && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Curve Spread</span>
                    <span className="font-medium">+{curveSpreadBp} bp</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time in Force</span>
                  <span className="font-medium">{timeInForce}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Messages */}
          {!isValid && (accountId || cusip || quantity) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-yellow-800">Validation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {!accountId && <li>- Select an account</li>}
                  {!cusip && <li>- Select an instrument</li>}
                  {!quantity && <li>- Enter quantity</li>}
                  {quantity && parseFloat(quantity) <= 0 && (
                    <li>- Quantity must be positive</li>
                  )}
                  {orderType === "LIMIT" && !limitPrice && (
                    <li>- Enter limit price</li>
                  )}
                  {orderType === "CURVE_RELATIVE" && !curveSpreadBp && (
                    <li>- Enter curve spread</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
