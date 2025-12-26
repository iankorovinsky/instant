"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  Download,
  ChevronDown,
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
  formatLargeNumber,
} from "@/lib/marketdata/mock-data";
import type { InstrumentType, MaturityBucket, InstrumentGroupBy } from "@/lib/marketdata/types";

const instrumentTypes: InstrumentType[] = ["bill", "note", "bond", "tips"];
const maturityBuckets: MaturityBucket[] = ["0-2y", "2-5y", "5-10y", "10-20y", "20y+"];

export default function InstrumentsPage() {
  const router = useRouter();
  const availableDates = getAvailableCurveDates();

  const [asOfDate, setAsOfDate] = useState<Date>(availableDates[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<InstrumentType[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<MaturityBucket[]>([]);
  const [groupBy, setGroupBy] = useState<InstrumentGroupBy>("none");

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

  const groupedInstruments = useMemo(() => {
    if (groupBy === "none") {
      return { "All Instruments": filteredInstruments };
    }

    return filteredInstruments.reduce((groups, instrument) => {
      const key = groupBy === "type" ? instrument.type : instrument.maturityBucket;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(instrument);
      return groups;
    }, {} as Record<string, typeof filteredInstruments>);
  }, [filteredInstruments, groupBy]);

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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedBuckets([]);
  };

  const hasFilters = searchQuery || selectedTypes.length > 0 || selectedBuckets.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instruments</h1>
          <p className="text-muted-foreground mt-1">
            US Treasury securities master data
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

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as InstrumentGroupBy)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="type">Group by Type</SelectItem>
                <SelectItem value="maturityBucket">Group by Maturity</SelectItem>
              </SelectContent>
            </Select>

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
        <FileText className="h-4 w-4" />
        <span>
          Showing {filteredInstruments.length} of {instruments.length} instruments
        </span>
      </div>

      {/* Instruments Table */}
      {Object.entries(groupedInstruments).map(([groupName, groupInstruments]) => (
        <Card key={groupName}>
          {groupBy !== "none" && (
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {groupBy === "type" ? (
                  <Badge className={getTypeColor(groupName as InstrumentType)}>
                    {groupName.toUpperCase()}
                  </Badge>
                ) : (
                  <Badge className={getBucketColor(groupName as MaturityBucket)}>
                    {groupName}
                  </Badge>
                )}
                <span className="text-muted-foreground font-normal">
                  ({groupInstruments.length} instruments)
                </span>
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={groupBy !== "none" ? "pt-0" : "pt-6"}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CUSIP</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead className="text-right">Coupon</TableHead>
                  <TableHead>Bucket</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Yield</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupInstruments.map((instrument) => (
                  <TableRow
                    key={instrument.cusip}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/app/marketdata/instruments/${instrument.cusip}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      {instrument.cusip}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {instrument.name}
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
                    <TableCell>
                      <Badge className={getBucketColor(instrument.maturityBucket)} variant="outline">
                        {instrument.maturityBucket}
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
                    <TableCell className="text-right font-mono">
                      {instrument.evaluatedPrice
                        ? formatDuration(instrument.evaluatedPrice.modifiedDuration)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatLargeNumber(instrument.outstandingAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {filteredInstruments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No instruments found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
