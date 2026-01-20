"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Building2,
  Briefcase,
  Settings2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/pms/ui";
import {
  getAccountView,
  getAccounts,
  getHouseholdView,
  getHouseholds,
  runOptimization,
} from "@/lib/api/pms";
import { BucketWeights } from "@/lib/pms/types";

type OptimizationScope = "account" | "household";

export default function OptimizationPage() {
  const router = useRouter();
  const [scope, setScope] = useState<OptimizationScope>("account");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>("");
  const [durationTarget, setDurationTarget] = useState<number>(5);
  const [useCustomWeights, setUseCustomWeights] = useState(false);
  const [bucketWeights, setBucketWeights] = useState<BucketWeights>({
    "0-2y": 20,
    "2-5y": 30,
    "5-10y": 30,
    "10-20y": 15,
    "20y+": 5,
  });
  const [maxPositionSize, setMaxPositionSize] = useState<number>(10);
  const [maxTurnover, setMaxTurnover] = useState<number>(20);
  const [assumptions, setAssumptions] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ accountId: string; name: string; householdId?: string }>>([]);
  const [households, setHouseholds] = useState<Array<{ householdId: string; name: string }>>([]);
  const [currentAnalytics, setCurrentAnalytics] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const selectedAccount = accounts.find((a) => a.accountId === selectedAccountId);
  const selectedHousehold = households.find((h) => h.householdId === selectedHouseholdId);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const [accountsResponse, householdsResponse] = await Promise.all([
          getAccounts(),
          getHouseholds(),
        ]);
        setAccounts(accountsResponse.accounts);
        setHouseholds(householdsResponse.households);
      } catch (err) {
        console.error("Failed to load PMS lists", err);
      }
    };
    loadLists();
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setCurrentAnalytics(null);
      if (scope === "account" && selectedAccountId) {
        setIsLoadingAnalytics(true);
        try {
          const view = await getAccountView(selectedAccountId);
          setCurrentAnalytics(view.analytics);
        } catch (err) {
          console.error("Failed to load account analytics", err);
        } finally {
          setIsLoadingAnalytics(false);
        }
      }
      if (scope === "household" && selectedHouseholdId) {
        setIsLoadingAnalytics(true);
        try {
          const view = await getHouseholdView(selectedHouseholdId);
          setCurrentAnalytics(view.analytics);
        } catch (err) {
          console.error("Failed to load household analytics", err);
        } finally {
          setIsLoadingAnalytics(false);
        }
      }
    };
    loadAnalytics();
  }, [scope, selectedAccountId, selectedHouseholdId]);


  const handleBucketWeightChange = (bucket: keyof BucketWeights, value: number) => {
    const newWeights = { ...bucketWeights, [bucket]: value };
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);

    // Normalize to 100% if exceeded
    if (total > 100) {
      const excess = total - 100;
      const otherBuckets = Object.keys(newWeights).filter((k) => k !== bucket) as (keyof BucketWeights)[];
      const adjustmentPerBucket = excess / otherBuckets.length;
      otherBuckets.forEach((b) => {
        newWeights[b] = Math.max(0, newWeights[b] - adjustmentPerBucket);
      });
    }

    setBucketWeights(newWeights);
  };

  const totalWeight = Object.values(bucketWeights).reduce((sum, w) => sum + w, 0);

  const handleRunOptimization = async () => {
    if (!isValid) return;
    setIsRunning(true);
    try {
      const response = await runOptimization({
        scope,
        scopeId: scope === "account" ? selectedAccountId : selectedHouseholdId,
        durationTarget,
        bucketWeights,
        constraints: {
          maxPositionSize,
          maxTurnover,
        },
        assumptions,
        requestedBy: "advisor@instant.com",
      });
      router.push(`/app/pms/proposals/${response.proposalId}`);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setIsRunning(false);
    }
  };

  const isValid =
    (scope === "account" ? selectedAccountId : selectedHouseholdId) &&
    durationTarget > 0 &&
    Math.abs(totalWeight - 100) < 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/pms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portfolio Optimization</h1>
            <p className="text-sm text-muted-foreground">
              Configure and run optimization to generate trade proposals
            </p>
          </div>
        </div>
        <Button onClick={handleRunOptimization} disabled={!isValid || isRunning}>
          {isRunning ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Optimization
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scope Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Scope</CardTitle>
              <CardDescription>
                Select the scope for optimization - individual account or entire household
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={scope === "account" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setScope("account");
                    setSelectedHouseholdId("");
                  }}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Account
                </Button>
                <Button
                  variant={scope === "household" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setScope("household");
                    setSelectedAccountId("");
                  }}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Household
                </Button>
              </div>

              {scope === "account" && (
                <div className="space-y-2">
                  <Label>Select Account</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an account..." />
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
                </div>
              )}

              {scope === "household" && (
                <div className="space-y-2">
                  <Label>Select Household</Label>
                  <Select value={selectedHouseholdId} onValueChange={setSelectedHouseholdId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a household..." />
                    </SelectTrigger>
                    <SelectContent>
                      {households.map((household) => {
                        const accountCount = accounts.filter(
                          (a) => a.householdId === household.householdId
                        ).length;
                        return (
                          <SelectItem key={household.householdId} value={household.householdId}>
                            <div className="flex items-center gap-2">
                              <span>{household.name}</span>
                              <span className="text-muted-foreground">
                                ({accountCount} accounts)
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Target Configuration</CardTitle>
              <CardDescription>
                Configure optimization targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Duration Target</Label>
                    <span className="text-sm font-medium">{durationTarget} years</span>
                  </div>
                  <Slider
                    value={[durationTarget]}
                    onValueChange={([value]) => setDurationTarget(value)}
                    min={1}
                    max={15}
                    step={0.5}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customWeights"
                    checked={useCustomWeights}
                    onCheckedChange={(checked) => setUseCustomWeights(!!checked)}
                  />
                  <Label htmlFor="customWeights">Customize bucket weights</Label>
                </div>

                {useCustomWeights && (
                  <div className="space-y-4 pl-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Target Bucket Weights</Label>
                      <Badge variant={Math.abs(totalWeight - 100) < 1 ? "secondary" : "destructive"}>
                        Total: {Math.round(totalWeight)}%
                      </Badge>
                    </div>
                    {Object.entries(bucketWeights).map(([bucket, weight]) => (
                      <div key={bucket} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{bucket}</span>
                          <span className="text-sm font-medium">{Math.round(weight)}%</span>
                        </div>
                        <Slider
                          value={[weight]}
                          onValueChange={([value]) =>
                            handleBucketWeightChange(bucket as keyof BucketWeights, value)
                          }
                          min={0}
                          max={100}
                          step={1}
                          disabled={!useCustomWeights}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Constraints
              </CardTitle>
              <CardDescription>Position and turnover limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Max Position Size</Label>
                    <span className="text-sm font-medium">{maxPositionSize}%</span>
                  </div>
                  <Slider
                    value={[maxPositionSize]}
                    onValueChange={([value]) => setMaxPositionSize(value)}
                    min={1}
                    max={25}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Max Turnover</Label>
                    <span className="text-sm font-medium">{maxTurnover}%</span>
                  </div>
                  <Slider
                    value={[maxTurnover]}
                    onValueChange={([value]) => setMaxTurnover(value)}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assumptions */}
          <Card>
            <CardHeader>
              <CardTitle>Assumptions & Notes</CardTitle>
              <CardDescription>
                Add any assumptions or notes for this optimization run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter assumptions about market conditions, client preferences, or other considerations..."
                value={assumptions}
                onChange={(e) => setAssumptions(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Current State */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Portfolio</CardTitle>
              <CardDescription>
                {scope === "account"
                  ? selectedAccount?.name || "Select an account"
                  : selectedHousehold?.name || "Select a household"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentAnalytics ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Value</span>
                    <span className="font-medium">
                      {formatCurrency(currentAnalytics.totalMarketValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Duration</span>
                    <span className="font-medium">{currentAnalytics.totalDuration.toFixed(2)}y</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Duration</span>
                    <span className="font-medium">{durationTarget}y</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration Gap</span>
                    <span
                      className={`font-medium ${
                        Math.abs(currentAnalytics.totalDuration - durationTarget) > 1
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {(currentAnalytics.totalDuration - durationTarget >= 0 ? "+" : "")}
                      {(currentAnalytics.totalDuration - durationTarget).toFixed(2)}y
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DV01</span>
                    <span className="font-medium">
                      {formatCurrency(currentAnalytics.totalDv01)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash</span>
                    <span className="font-medium">
                      {formatCurrency(currentAnalytics.cashBalance)} (
                      {currentAnalytics.cashPercentage}%)
                    </span>
                  </div>
                </div>
              ) : isLoadingAnalytics ? (
                <p className="text-muted-foreground text-center py-8">
                  Loading current metrics...
                </p>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a {scope} to view current metrics
                </p>
              )}
            </CardContent>
          </Card>

          {currentAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Current Bucket Weights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(Object.entries(currentAnalytics.bucketWeights) as [string, number][]).map(([bucket, weight]) => {
                    const target = bucketWeights[bucket as keyof BucketWeights];
                    const diff = weight - target;
                    return (
                      <div key={bucket}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{bucket}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{weight}%</span>
                            {useCustomWeights ? (
                              <span
                                className={`text-xs ${
                                  Math.abs(diff) > 5
                                    ? diff > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                ({diff >= 0 ? "+" : ""}
                                {diff}%)
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${weight}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
