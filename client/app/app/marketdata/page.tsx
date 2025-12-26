"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  FileText,
  BarChart3,
  Grid3X3,
  ArrowRight,
  Calendar,
  DollarSign,
  Clock,
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
  getMarketDataSummary,
  getInstrumentsWithPricing,
  yieldCurves,
  getTypeColor,
  getBucketColor,
  formatDate,
  formatDateTime,
  formatPrice,
  formatYield,
  formatDuration,
} from "@/lib/marketdata/mock-data";

export default function MarketDataDashboardPage() {
  const router = useRouter();
  const summary = getMarketDataSummary();
  const latestCurve = yieldCurves[0];
  const instrumentsWithPricing = getInstrumentsWithPricing().slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Data</h1>
          <p className="text-muted-foreground mt-1">
            Instrument master data, yield curves, and evaluated pricing
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Pricing as-of:</span>
          <span className="font-medium">{summary.latestCurveDate ? formatDate(summary.latestCurveDate) : "N/A"}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instruments</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalInstruments}</div>
            <p className="text-xs text-muted-foreground">
              {summary.billCount} bills, {summary.noteCount} notes, {summary.bondCount} bonds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yield Curves</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.availableCurveDates.length}</div>
            <p className="text-xs text-muted-foreground">
              Latest: {summary.latestCurveDate ? formatDate(summary.latestCurveDate) : "None"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">10Y Treasury Yield</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestCurve?.curvePoints.find((p) => p.tenor === "10Y")?.parYield.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              As of {latestCurve ? formatDate(latestCurve.asOfDate) : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TIPS Instruments</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.tipsCount}</div>
            <p className="text-xs text-muted-foreground">
              Inflation-protected securities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/marketdata/instruments")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Instruments</CardTitle>
              <CardDescription>
                {summary.totalInstruments} UST securities
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/marketdata/curves")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Yield Curves</CardTitle>
              <CardDescription>
                View and manage yield curve data
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/marketdata/pricing")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Grid3X3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Market Grid</CardTitle>
              <CardDescription>
                Evaluated pricing and risk metrics
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      {/* Maturity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Instrument Distribution by Maturity</CardTitle>
          <CardDescription>Number of instruments in each maturity bucket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(summary.bucketCounts).map(([bucket, count]) => (
              <div key={bucket} className="text-center">
                <div className="text-sm font-medium mb-2">{bucket}</div>
                <div className="h-24 bg-muted rounded relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded"
                    style={{ height: `${Math.min((count / summary.totalInstruments) * 100 * 3, 100)}%` }}
                  />
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">instruments</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Latest Yield Curve */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Latest Yield Curve</CardTitle>
                <CardDescription>
                  As of {latestCurve ? formatDate(latestCurve.asOfDate) : "N/A"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/marketdata/curves">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {latestCurve ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenor</TableHead>
                    <TableHead className="text-right">Par Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestCurve.curvePoints.map((point) => (
                    <TableRow key={point.tenor}>
                      <TableCell className="font-medium">{point.tenor}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatYield(point.parYield)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No yield curve data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Instruments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Instruments</CardTitle>
                <CardDescription>
                  With evaluated pricing
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/marketdata/pricing">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CUSIP</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Yield</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instrumentsWithPricing.map((instrument) => (
                  <TableRow
                    key={instrument.cusip}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/app/marketdata/instruments/${instrument.cusip}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      {instrument.cusip}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(instrument.type)}>
                        {instrument.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {instrument.evaluatedPrice
                        ? formatPrice(instrument.evaluatedPrice.cleanPrice)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {instrument.evaluatedPrice
                        ? formatYield(instrument.evaluatedPrice.yieldToMaturity)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Curve Source Info */}
      {latestCurve && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Data Source Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <span className="text-sm text-muted-foreground">Source URL</span>
                <p className="font-mono text-sm truncate">{latestCurve.source.sourceUrl || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Ingested At</span>
                <p className="text-sm">{formatDateTime(latestCurve.source.ingestedAt)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Ingested By</span>
                <p className="text-sm">{latestCurve.source.ingestedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
