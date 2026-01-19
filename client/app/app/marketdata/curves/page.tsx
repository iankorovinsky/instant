"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurveDates, useYieldCurve } from "@/lib/hooks/use-marketdata";
import { useMarketDataAsOfDate } from "@/lib/marketdata/use-asof-date";
import { formatDate, formatDateTime, formatYield } from "@/lib/marketdata/formatters";
import type { Tenor } from "@/lib/marketdata/types";

const tenorOrder: Tenor[] = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"];

export default function YieldCurvesPage() {
  const { data: availableDates = [] } = useCurveDates();
  const { asOfDate: selectedDate, setAsOfDate: setSelectedDate } = useMarketDataAsOfDate(availableDates);
  const [compareDate, setCompareDate] = useState<Date | null>(null);

  const { data: selectedCurve, isLoading: curveLoading } = useYieldCurve(selectedDate ?? undefined);
  const { data: compareCurve } = useYieldCurve(compareDate ?? undefined);

  useEffect(() => {
    if (!compareDate && availableDates.length > 1) {
      setCompareDate(availableDates[1]);
    }
  }, [availableDates, compareDate]);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (!selectedCurve) return [];

    return tenorOrder.map((tenor) => {
      const currentPoint = selectedCurve.curvePoints.find((p) => p.tenor === tenor);
      const comparePoint = compareCurve?.curvePoints.find((p) => p.tenor === tenor);

      const currentYield = currentPoint?.parYield ?? 0;
      const compareYield = comparePoint?.parYield ?? 0;
      const change = comparePoint ? currentYield - compareYield : null;

      return {
        tenor,
        currentYield,
        compareYield: comparePoint ? compareYield : null,
        change,
      };
    });
  }, [selectedCurve, compareCurve]);

  // Calculate curve statistics
  const curveStats = useMemo(() => {
    if (!selectedCurve) return null;

    const points = selectedCurve.curvePoints;
    const shortEnd = points.find((p) => p.tenor === "2Y")?.parYield ?? 0;
    const longEnd = points.find((p) => p.tenor === "10Y")?.parYield ?? 0;
    const spread2s10s = longEnd - shortEnd;

    const threeMonth = points.find((p) => p.tenor === "3M")?.parYield ?? 0;
    const tenYear = points.find((p) => p.tenor === "10Y")?.parYield ?? 0;
    const spread3m10y = tenYear - threeMonth;

    const yields = points.map((p) => p.parYield);
    const avgYield = yields.reduce((a, b) => a + b, 0) / yields.length;
    const maxYield = Math.max(...yields);
    const minYield = Math.min(...yields);

    return {
      spread2s10s,
      spread3m10y,
      avgYield,
      maxYield,
      minYield,
      isInverted: spread2s10s < 0,
    };
  }, [selectedCurve]);

  const historyRows = useMemo(() => {
    return availableDates.map((date) => {
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      return {
        date,
        curve: isSelected ? selectedCurve : null,
      };
    });
  }, [availableDates, selectedCurve, selectedDate]);

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-muted-foreground";
    if (change > 0) return "text-red-600";
    if (change < 0) return "text-green-600";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yield Curves</h1>
          <p className="text-muted-foreground mt-1">
            US Treasury par yield curves
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Date Selectors */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Primary Curve:</span>
              <Select
                value={selectedDate?.toISOString() ?? ""}
                onValueChange={(value) => setSelectedDate(new Date(value))}
                disabled={!selectedDate}
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

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Compare with:</span>
              <Select
                value={compareDate?.toISOString() ?? "none"}
                onValueChange={(value) =>
                  setCompareDate(value === "none" ? null : new Date(value))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No comparison</SelectItem>
                  {availableDates
                    .filter((d) =>
                      selectedDate ? d.toISOString() !== selectedDate.toISOString() : true
                    )
                    .map((date) => (
                      <SelectItem key={date.toISOString()} value={date.toISOString()}>
                        {formatDate(date)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCurve && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span>
                Viewing curve as-of <span className="text-foreground">{formatDate(selectedCurve.asOfDate)}</span>
              </span>
              <span>Source: {selectedCurve.source.sourceUrl || "FRED"}</span>
              <span>Ingested: {formatDateTime(selectedCurve.source.ingestedAt)}</span>
              <span>Points: {selectedCurve.curvePoints.length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Curve Statistics */}
      {curveStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">2s10s Spread</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>10Y yield minus 2Y yield</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold font-mono ${
                  curveStats.isInverted ? "text-red-600" : "text-green-600"
                }`}>
                  {curveStats.spread2s10s >= 0 ? "+" : ""}{curveStats.spread2s10s.toFixed(2)} bps
                </div>
                {curveStats.isInverted ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {curveStats.isInverted ? "Inverted curve" : "Normal curve"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">3m10y Spread</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>10Y yield minus 3M yield</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${
                curveStats.spread3m10y < 0 ? "text-red-600" : "text-green-600"
              }`}>
                {curveStats.spread3m10y >= 0 ? "+" : ""}{curveStats.spread3m10y.toFixed(2)} bps
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Term structure indicator
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Yield</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatYield(curveStats.avgYield)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all tenors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yield Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {curveStats.minYield.toFixed(2)} - {curveStats.maxYield.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Min to max yield
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Curve Visualization (Simple Bar Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Yield Curve Visualization</CardTitle>
          <CardDescription>
            Par yields by tenor {compareDate && `(vs ${formatDate(compareDate)})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {curveLoading && (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Loading curve data...
            </div>
          )}
          {!curveLoading && !selectedCurve && (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              No curve data available for this date.
            </div>
          )}
          {!curveLoading && selectedCurve && (
            <div className="h-64 flex items-end justify-between gap-2">
              {comparisonData.map((point) => {
                const maxYield = 6; // Max for scaling
                const heightPercent = (point.currentYield / maxYield) * 100;
                const compareHeightPercent = point.compareYield
                  ? (point.compareYield / maxYield) * 100
                  : 0;

                return (
                  <div key={point.tenor} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-48 relative flex items-end justify-center gap-1">
                      {compareCurve && (
                        <div
                          className="w-1/3 bg-gray-300 rounded-t transition-all"
                          style={{ height: `${compareHeightPercent}%` }}
                        />
                      )}
                      <div
                        className="w-1/3 bg-primary rounded-t transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-center">
                      {point.currentYield.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {point.tenor}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {compareCurve && (
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded" />
                <span className="text-sm">{selectedDate ? formatDate(selectedDate) : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded" />
                <span className="text-sm">{formatDate(compareDate!)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Curve Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Curve Points</CardTitle>
          <CardDescription>
            Detailed yield data {compareDate && "with changes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenor</TableHead>
                <TableHead className="text-right">Par Yield</TableHead>
                {compareCurve && (
                  <>
                    <TableHead className="text-right">
                      Compare ({formatDate(compareDate!)})
                    </TableHead>
                    <TableHead className="text-right">Change (bps)</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((point) => (
                <TableRow key={point.tenor}>
                  <TableCell>
                    <Badge variant="outline">{point.tenor}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatYield(point.currentYield)}
                  </TableCell>
                  {compareCurve && (
                    <>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {point.compareYield !== null
                          ? formatYield(point.compareYield)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 font-mono ${getChangeColor(point.change)}`}>
                          {getChangeIcon(point.change)}
                          {point.change !== null
                            ? `${point.change >= 0 ? "+" : ""}${(point.change * 100).toFixed(1)}`
                            : "-"}
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Available Curves History */}
      <Card>
        <CardHeader>
          <CardTitle>Available Curves</CardTitle>
          <CardDescription>Historical yield curve data</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>As-of Date</TableHead>
                <TableHead className="text-right">2Y</TableHead>
                <TableHead className="text-right">5Y</TableHead>
                <TableHead className="text-right">10Y</TableHead>
                <TableHead className="text-right">30Y</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Ingested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyRows.map(({ date, curve }) => (
                <TableRow
                  key={date.toISOString()}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedDate(date)}
                >
                  <TableCell className="font-medium">
                    {formatDate(date)}
                    {selectedDate && date.toDateString() === selectedDate.toDateString() && (
                      <Badge variant="secondary" className="ml-2">Selected</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {curve?.curvePoints.find((p) => p.tenor === "2Y")?.parYield.toFixed(2) ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {curve?.curvePoints.find((p) => p.tenor === "5Y")?.parYield.toFixed(2) ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {curve?.curvePoints.find((p) => p.tenor === "10Y")?.parYield.toFixed(2) ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {curve?.curvePoints.find((p) => p.tenor === "30Y")?.parYield.toFixed(2) ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]">
                    {curve?.source.ingestedBy ?? "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {curve?.source.ingestedAt ? formatDateTime(curve.source.ingestedAt) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
