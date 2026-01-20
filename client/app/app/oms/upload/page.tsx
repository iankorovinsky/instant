"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Check,
  X,
  AlertTriangle,
  Send,
  Save,
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
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getAccounts } from "@/lib/api/pms";
import { fetchInstruments } from "@/lib/marketdata/api";
import { useBulkCreateOrders } from "@/lib/hooks/use-oms";
import { formatOrderQuantity, formatPrice } from "@/lib/oms/ui";
import type { BulkOrderRow, BulkOrderValidationResult } from "@/lib/oms/types";
import type { InstrumentWithPricing } from "@/lib/marketdata/types";

type UploadStep = "upload" | "preview" | "processing" | "complete";

export default function BulkUploadPage() {
  const [step, setStep] = useState<UploadStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [parsedOrders, setParsedOrders] = useState<BulkOrderValidationResult[]>([]);
  const [submitOption, setSubmitOption] = useState<"draft" | "approval">("draft");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const [accounts, setAccounts] = useState<
    Array<{ accountId: string; householdId: string; name: string; householdName?: string }>
  >([]);
  const [instruments, setInstruments] = useState<InstrumentWithPricing[]>([]);

  const bulkCreate = useBulkCreateOrders();

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [accountsResponse, instrumentsResponse] = await Promise.all([
          getAccounts(),
          fetchInstruments({ limit: 500 }),
        ]);
        if (!active) return;
        setAccounts(accountsResponse.accounts || []);
        setInstruments(instrumentsResponse.instruments || []);
      } catch (err) {
        console.error("Failed to load bulk upload reference data", err);
        if (!active) return;
        setAccounts([]);
        setInstruments([]);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const parseNumber = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const parseCsvText = (text: string): BulkOrderRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((header) => header.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((value) => value.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? "";
      });

      const side = (row.side || "").toUpperCase();
      const orderType = (row.orderType || "MARKET").toUpperCase();
      const timeInForce = (row.timeInForce || "DAY").toUpperCase();

      return {
        accountId: row.accountId || row.account || "",
        cusip: row.cusip || row.instrumentId || "",
        side: (side === "SELL" ? "SELL" : "BUY"),
        quantity: Number(row.quantity ?? 0),
        orderType: orderType === "LIMIT"
          ? "LIMIT"
          : orderType === "CURVE_RELATIVE"
          ? "CURVE_RELATIVE"
          : "MARKET",
        limitPrice: parseNumber(row.limitPrice),
        curveSpreadBp: parseNumber(row.curveSpreadBp),
        timeInForce: timeInForce === "IOC" ? "IOC" : "DAY",
        notes: row.notes || undefined,
      };
    });
  };

  // Validate a parsed order
  const validateOrder = (row: BulkOrderRow, index: number): BulkOrderValidationResult => {
    const errors: string[] = [];

    // Validate account
    if (!row.accountId) {
      errors.push("Account ID required");
    } else {
      const account = accounts.find((a) => a.accountId === row.accountId);
      if (!account) {
        errors.push("Account not found");
      }
    }

    // Validate instrument
    if (!row.cusip) {
      errors.push("CUSIP required");
    } else {
      const instrument = instruments.find((i) => i.cusip === row.cusip);
      if (!instrument) {
        errors.push("Instrument not found");
      }
    }

    // Validate quantity
    if (!row.quantity || row.quantity <= 0) {
      errors.push("Invalid quantity");
    }

    // Validate side
    if (!["BUY", "SELL"].includes(row.side)) {
      errors.push("Invalid side (must be BUY or SELL)");
    }

    // Validate order type specific fields
    if (row.orderType === "LIMIT" && (!row.limitPrice || row.limitPrice <= 0)) {
      errors.push("Limit price required for LIMIT orders");
    }
    if (row.orderType === "CURVE_RELATIVE" && row.curveSpreadBp === undefined) {
      errors.push("Curve spread required for CURVE_RELATIVE orders");
    }

    return {
      row: index + 1,
      data: row,
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      void processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    try {
      const contents = await file.text();
      const rows = parseCsvText(contents);
      const validated = rows.map((order, idx) => validateOrder(order, idx));
      setParsedOrders(validated);
      setStep("preview");
    } catch (err) {
      console.error("Failed to parse CSV", err);
      setParsedOrders([]);
      setStep("preview");
    }
  };

  const handleSubmit = async () => {
    setStep("processing");
    setProgress(10);

    const validOrders = parsedOrders.filter((o) => o.isValid);
    const invalidOrders = parsedOrders.filter((o) => !o.isValid);

    try {
      setProgress(40);
      const response = await bulkCreate.mutateAsync({
        orders: validOrders.map((order) => ({
          accountId: order.data.accountId || "",
          instrumentId: order.data.cusip,
          side: order.data.side,
          quantity: order.data.quantity,
          orderType: order.data.orderType,
          limitPrice: order.data.limitPrice,
          curveSpreadBp: order.data.curveSpreadBp,
          timeInForce: order.data.timeInForce || "DAY",
          createdBy: "advisor@instant.com",
        })),
        createdBy: "advisor@instant.com",
      });

      const success = response.results.filter((result) => result.status === "created").length;
      const failed = response.results.length - success;

      setProgress(100);
      setResults({
        success,
        errors: failed + invalidOrders.length,
      });
      setStep("complete");
    } catch (err) {
      console.error("Failed to submit bulk orders", err);
      setProgress(100);
      setResults({
        success: 0,
        errors: validOrders.length + invalidOrders.length,
      });
      setStep("complete");
    }
  };

  const validCount = parsedOrders.filter((o) => o.isValid).length;
  const errorCount = parsedOrders.filter((o) => !o.isValid).length;

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
            <h1 className="text-2xl font-bold tracking-tight">Bulk Order Upload</h1>
            <p className="text-sm text-muted-foreground">
              Upload multiple orders from a CSV file
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Drag and drop your CSV file or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                <p className="text-muted-foreground mb-4">or</p>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSV Format</CardTitle>
              <CardDescription>Required columns and format specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Required Columns</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <code className="bg-muted px-1 rounded">accountId</code> - Account identifier
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">cusip</code> - Instrument CUSIP
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">side</code> - BUY or SELL
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">quantity</code> - Par value
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">orderType</code> - MARKET, LIMIT, or
                    CURVE_RELATIVE
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Conditional Columns</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <code className="bg-muted px-1 rounded">limitPrice</code> - Required for LIMIT
                    orders
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">curveSpreadBp</code> - Required for
                    CURVE_RELATIVE orders
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Optional Columns</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <code className="bg-muted px-1 rounded">timeInForce</code> - DAY (default) or
                    IOC
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">notes</code> - Order notes
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {fileName}
                  </CardTitle>
                  <CardDescription>
                    {parsedOrders.length} orders parsed
                  </CardDescription>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">{validCount} valid</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-medium">{errorCount} errors</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>CUSIP</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price/Spread</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedOrders.map((result) => {
                    const account = accounts.find((a) => a.accountId === result.data.accountId);
                    const instrument = instruments.find((i) => i.cusip === result.data.cusip);

                    return (
                      <TableRow
                        key={result.row}
                        className={!result.isValid ? "bg-red-50" : ""}
                      >
                        <TableCell className="font-mono text-sm">{result.row}</TableCell>
                        <TableCell>
                          {result.isValid ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{account?.name || result.data.accountId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{result.data.cusip}</p>
                            {instrument && (
                              <p className="text-xs text-muted-foreground truncate max-w-32">
                                {instrument.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              result.data.side === "BUY" ? "text-green-600" : "text-red-600"
                            }
                          >
                            {result.data.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatOrderQuantity(result.data.quantity)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{result.data.orderType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {result.data.orderType === "LIMIT" && result.data.limitPrice
                            ? formatPrice(result.data.limitPrice)
                            : result.data.orderType === "CURVE_RELATIVE" &&
                              result.data.curveSpreadBp
                            ? `+${result.data.curveSpreadBp}bp`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {result.errors.length > 0 && (
                            <span className="text-red-600 text-sm">
                              {result.errors.join(", ")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Submit Options */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Options</CardTitle>
              <CardDescription>Choose how to submit the valid orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={submitOption}
                onValueChange={(v) => setSubmitOption(v as "draft" | "approval")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="draft" id="draft" />
                  <Label htmlFor="draft" className="cursor-pointer">
                    <div>
                      <p className="font-medium">Save as Drafts</p>
                      <p className="text-sm text-muted-foreground">
                        Orders will be created in DRAFT state for review
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="approval" id="approval" />
                  <Label htmlFor="approval" className="cursor-pointer">
                    <div>
                      <p className="font-medium">Submit for Approval</p>
                      <p className="text-sm text-muted-foreground">
                        Orders will go directly to APPROVAL_PENDING state
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={validCount === 0}>
                  {submitOption === "draft" ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create {validCount} Drafts
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit {validCount} Orders
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === "processing" && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Orders</CardTitle>
            <CardDescription>Please wait while orders are being created...</CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <div className="max-w-md mx-auto space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Upload Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Successfully Created</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{results.success} orders</p>
              </div>

              {results.errors > 0 && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{results.errors} orders</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Upload More
              </Button>
              <Button asChild>
                <Link href="/app/oms/orders">View Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
