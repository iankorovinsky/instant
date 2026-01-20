"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Clock,
  FileText,
  DollarSign,
  Percent,
  BarChart3,
  ExternalLink,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCurveDates,
  useInstrumentDetail,
  usePricingHistory,
} from "@/lib/hooks/use-marketdata";
import { useMarketDataAsOfDate } from "@/lib/marketdata/use-asof-date";
import {
  getTypeColor,
  getBucketColor,
  formatDate,
  formatDateTime,
  formatPrice,
  formatYield,
  formatDuration,
  formatLargeNumber,
  formatPercent,
} from "@/lib/marketdata/formatters";

interface PageProps {
  params: Promise<{ cusip: string }>;
}

export default function InstrumentDetailPage({ params }: PageProps) {
  const { cusip } = use(params);
  const router = useRouter();
  const { data: availableDates = [] } = useCurveDates();
  const { asOfDate, setAsOfDate } = useMarketDataAsOfDate(availableDates);
  const { data: instrument, isLoading, error } = useInstrumentDetail(cusip, asOfDate ?? undefined);
  const { data: pricingHistoryData } = usePricingHistory(cusip, 10);

  const pricingHistory = useMemo(() => {
    return (pricingHistoryData || []).map((price) => ({
      date: price.asOfDate,
      price: price.cleanPrice,
      yield: price.yieldToMaturity,
      duration: price.modifiedDuration,
      dv01: price.dv01,
    }));
  }, [pricingHistoryData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Loading instrument...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !instrument) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Instrument not found</p>
              <p className="text-sm">CUSIP: {cusip}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pricingDate = asOfDate ?? new Date();
  const yearsToMaturity = (instrument.maturityDate.getTime() - pricingDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">{instrument.cusip}</h1>
              <Badge className={getTypeColor(instrument.type)}>
                {instrument.type.toUpperCase()}
              </Badge>
              <Badge className={getBucketColor(instrument.maturityBucket)} variant="outline">
                {instrument.maturityBucket}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{instrument.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">As-of Date:</span>
          <Select
            value={asOfDate?.toISOString() ?? ""}
            onValueChange={(value) => setAsOfDate(new Date(value))}
            disabled={!asOfDate}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((date) => (
                <SelectItem key={date.toISOString()} value={date.toISOString()}>
                  {formatDate(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing Summary Cards */}
      {instrument.evaluatedPrice && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluated Clean Price</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatPrice(instrument.evaluatedPrice.cleanPrice)}
              </div>
              <p className="text-xs text-muted-foreground">
                Dirty: {formatPrice(instrument.evaluatedPrice.dirtyPrice)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluated Yield</CardTitle>
              <Percent className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatYield(instrument.evaluatedPrice.yieldToMaturity)}
              </div>
              <p className="text-xs text-muted-foreground">
                Accrued: {formatPrice(instrument.evaluatedPrice.accruedInterest)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modified Duration</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatDuration(instrument.evaluatedPrice.modifiedDuration)}
              </div>
              <p className="text-xs text-muted-foreground">
                DV01: ${instrument.evaluatedPrice.dv01.toFixed(4)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time to Maturity</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yearsToMaturity.toFixed(2)} years
              </div>
              <p className="text-xs text-muted-foreground">
                Matures: {formatDate(instrument.maturityDate)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Instrument Details */}
        <Card>
          <CardHeader>
            <CardTitle>Instrument Details</CardTitle>
            <CardDescription>Security master data</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">CUSIP</dt>
                <dd className="font-mono">{instrument.cusip}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-right max-w-[200px] truncate">{instrument.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd>
                  <Badge className={getTypeColor(instrument.type)}>
                    {instrument.type.toUpperCase()}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coupon Rate</dt>
                <dd className="font-mono">
                  {instrument.coupon > 0 ? formatPercent(instrument.coupon) : "Zero Coupon"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coupon Frequency</dt>
                <dd>
                  {instrument.couponFrequency === 0
                    ? "N/A"
                    : `${instrument.couponFrequency}x/year`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Day Count</dt>
                <dd className="font-mono">{instrument.dayCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Issue Date</dt>
                <dd>{formatDate(instrument.issueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Maturity Date</dt>
                <dd>{formatDate(instrument.maturityDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Currency</dt>
                <dd>{instrument.currency}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Amounts & Ratings */}
        <Card>
          <CardHeader>
            <CardTitle>Amounts & Ratings</CardTitle>
            <CardDescription>Issuance and credit information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Issued Amount</dt>
                <dd className="font-medium">{formatLargeNumber(instrument.issuedAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Outstanding Amount</dt>
                <dd className="font-medium">{formatLargeNumber(instrument.outstandingAmount)}</dd>
              </div>
              <div className="border-t my-4" />
              <div className="flex justify-between">
                <dt className="text-muted-foreground">S&P Rating</dt>
                <dd>
                  <Badge variant="outline">{instrument.standardPoorRating || "N/A"}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Moody's Rating</dt>
                <dd>
                  <Badge variant="outline">{instrument.moodyRating || "N/A"}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fitch Rating</dt>
                <dd>
                  <Badge variant="outline">{instrument.fitchRating || "N/A"}</Badge>
                </dd>
              </div>
              <div className="border-t my-4" />
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-sm">{formatDateTime(instrument.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="text-sm">{formatDateTime(instrument.updatedAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Pricing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pricing History</CardTitle>
              <CardDescription>Evaluated prices across available dates</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/marketdata/pricing">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Market Grid
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>As-of Date</TableHead>
                <TableHead className="text-right">Evaluated Clean Price</TableHead>
                <TableHead className="text-right">Evaluated Yield</TableHead>
                <TableHead className="text-right">Modified Duration</TableHead>
                <TableHead className="text-right">DV01</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingHistory.map((history) => (
                <TableRow key={history.date.toISOString()}>
                  <TableCell>{formatDate(history.date)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {history.price ? formatPrice(history.price) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {history.yield ? formatYield(history.yield) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {history.duration ? formatDuration(history.duration) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {history.dv01 ? `$${history.dv01.toFixed(4)}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing Source */}
      {instrument.evaluatedPrice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pricing Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <span className="text-sm text-muted-foreground">Pricing Model</span>
                <p className="font-mono text-sm">{instrument.evaluatedPrice.pricingModelVersion}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Curve Source</span>
                <p className="font-mono text-sm truncate">
                  {instrument.evaluatedPrice.curveSource.sourceUrl || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Computed At</span>
                <p className="text-sm">{formatDateTime(instrument.evaluatedPrice.computedAt)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Curve Ingested By</span>
                <p className="text-sm">{instrument.evaluatedPrice.curveSource.ingestedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
