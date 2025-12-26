"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Calendar,
  Download,
  Grid3X3,
  ChevronDown,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getInstrumentsWithPricing,
  getAvailableCurveDates,
  getTypeColor,
  getBucketColor,
  formatDate,
  formatPrice,
  formatYield,
  formatDuration,
} from "@/lib/marketdata/mock-data";
import type { InstrumentType, MaturityBucket, InstrumentWithPricing } from "@/lib/marketdata/types";

const instrumentTypes: InstrumentType[] = ["bill", "note", "bond", "tips"];
const maturityBuckets: MaturityBucket[] = ["0-2y", "2-5y", "5-10y", "10-20y", "20y+"];

type SortField = "cusip" | "type" | "maturity" | "coupon" | "price" | "yield" | "duration" | "dv01";
type SortDirection = "asc" | "desc";

export default function MarketGridPage() {
  const router = useRouter();
  const availableDates = getAvailableCurveDates();

  const [asOfDate, setAsOfDate] = useState<Date>(availableDates[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<InstrumentType[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<MaturityBucket[]>([]);
  const [sortField, setSortField] = useState<SortField>("yield");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const instruments = useMemo(() => {
    return getInstrumentsWithPricing(asOfDate);
  }, [asOfDate]);

  const filteredInstruments = useMemo(() => {
    return instruments.filter((instrument) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesCusip = instrument.cusip.toLowerCase().includes(query);
        const matchesName = instrument.name.toLowerCase().includes(query);
        if (!matchesCusip && !matchesName) return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(instrument.type)) {
        return false;
      }

      // Bucket filter
      if (selectedBuckets.length > 0 && !selectedBuckets.includes(instrument.maturityBucket)) {
        return false;
      }

      return true;
    });
  }, [instruments, searchQuery, selectedTypes, selectedBuckets]);

  const sortedInstruments = useMemo(() => {
    return [...filteredInstruments].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "cusip":
          comparison = a.cusip.localeCompare(b.cusip);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "maturity":
          comparison = a.maturityDate.getTime() - b.maturityDate.getTime();
          break;
        case "coupon":
          comparison = a.coupon - b.coupon;
          break;
        case "price":
          comparison = (a.evaluatedPrice?.cleanPrice ?? 0) - (b.evaluatedPrice?.cleanPrice ?? 0);
          break;
        case "yield":
          comparison = (a.evaluatedPrice?.yieldToMaturity ?? 0) - (b.evaluatedPrice?.yieldToMaturity ?? 0);
          break;
        case "duration":
          comparison = (a.evaluatedPrice?.modifiedDuration ?? 0) - (b.evaluatedPrice?.modifiedDuration ?? 0);
          break;
        case "dv01":
          comparison = (a.evaluatedPrice?.dv01 ?? 0) - (b.evaluatedPrice?.dv01 ?? 0);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredInstruments, sortField, sortDirection]);

  // Calculate grid statistics
  const gridStats = useMemo(() => {
    const withPricing = filteredInstruments.filter((i) => i.evaluatedPrice);
    if (withPricing.length === 0) return null;

    const yields = withPricing.map((i) => i.evaluatedPrice!.yieldToMaturity);
    const durations = withPricing.map((i) => i.evaluatedPrice!.modifiedDuration);
    const prices = withPricing.map((i) => i.evaluatedPrice!.cleanPrice);

    return {
      count: withPricing.length,
      avgYield: yields.reduce((a, b) => a + b, 0) / yields.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minYield: Math.min(...yields),
      maxYield: Math.max(...yields),
    };
  }, [filteredInstruments]);

  const toggleType = (type: InstrumentType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleBucket = (bucket: MaturityBucket) => {
    setSelectedBuckets((prev) =>
      prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedBuckets([]);
  };

  const hasFilters = searchQuery || selectedTypes.length > 0 || selectedBuckets.length > 0;

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <SortAsc className="ml-2 h-4 w-4" />
        ) : (
          <SortDesc className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Grid</h1>
          <p className="text-muted-foreground mt-1">
            Evaluated pricing and risk metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">As-of Date:</span>
            <Select
              value={asOfDate.toISOString()}
              onValueChange={(value) => setAsOfDate(new Date(value))}
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Grid Statistics */}
      {gridStats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Securities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gridStats.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Yield</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatYield(gridStats.avgYield)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Yield Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {gridStats.minYield.toFixed(2)}-{gridStats.maxYield.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatDuration(gridStats.avgDuration)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatPrice(gridStats.avgPrice)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by CUSIP or name..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Type
                  {selectedTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedTypes.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {instrumentTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  >
                    <Badge className={getTypeColor(type)} variant="outline">
                      {type.toUpperCase()}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Maturity
                  {selectedBuckets.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedBuckets.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {maturityBuckets.map((bucket) => (
                  <DropdownMenuCheckboxItem
                    key={bucket}
                    checked={selectedBuckets.includes(bucket)}
                    onCheckedChange={() => toggleBucket(bucket)}
                  >
                    <Badge className={getBucketColor(bucket)} variant="outline">
                      {bucket}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Grid3X3 className="h-4 w-4" />
        <span>
          Showing {sortedInstruments.length} securities with pricing
        </span>
        <span>•</span>
        <span>
          Sorted by {sortField} ({sortDirection === "asc" ? "ascending" : "descending"})
        </span>
      </div>

      {/* Pricing Grid */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="cusip">CUSIP</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="type">Type</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="maturity">Maturity</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="coupon">Coupon</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="price">Clean Price</SortButton>
                  </TableHead>
                  <TableHead className="text-right">Dirty Price</TableHead>
                  <TableHead className="text-right">Accrued</TableHead>
                  <TableHead className="text-right">
                    <SortButton field="yield">YTM</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="duration">Duration</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="dv01">DV01</SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInstruments.map((instrument) => (
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
                    <TableCell>{formatDate(instrument.maturityDate)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {instrument.coupon > 0 ? `${instrument.coupon}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {instrument.evaluatedPrice
                        ? formatPrice(instrument.evaluatedPrice.cleanPrice)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {instrument.evaluatedPrice
                        ? formatPrice(instrument.evaluatedPrice.dirtyPrice)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {instrument.evaluatedPrice
                        ? formatPrice(instrument.evaluatedPrice.accruedInterest)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {instrument.evaluatedPrice
                        ? formatYield(instrument.evaluatedPrice.yieldToMaturity)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {instrument.evaluatedPrice
                        ? formatDuration(instrument.evaluatedPrice.modifiedDuration)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {instrument.evaluatedPrice
                        ? `$${instrument.evaluatedPrice.dv01.toFixed(4)}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {sortedInstruments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No securities found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
