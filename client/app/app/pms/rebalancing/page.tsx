"use client";

import { useState } from "react";
import {
  Plus,
  Clock,
  TrendingUp,
  Settings2,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  PlayCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rebalancingRules, formatDate } from "@/lib/pms/mock-data";
import type { RebalancingRule } from "@/lib/pms/types";

export default function RebalancingRulesPage() {
  const [rules, setRules] = useState<RebalancingRule[]>(rebalancingRules);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRuleType, setNewRuleType] = useState<"TIME_BASED" | "DRIFT_BASED">("TIME_BASED");
  const [newRuleName, setNewRuleName] = useState("");
  const [driftThreshold, setDriftThreshold] = useState(15);
  const [schedule, setSchedule] = useState("monthly");
  const [autoApprove, setAutoApprove] = useState(false);

  const timeBasedRules = rules.filter((r) => r.type === "TIME_BASED");
  const driftBasedRules = rules.filter((r) => r.type === "DRIFT_BASED");

  const toggleRuleEnabled = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.ruleId === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleCreateRule = () => {
    const newRule: RebalancingRule = {
      ruleId: `rule-${Date.now()}`,
      name: newRuleName,
      type: newRuleType,
      scope: "all",
      ...(newRuleType === "TIME_BASED" ? { schedule: getScheduleCron(schedule) } : {}),
      ...(newRuleType === "DRIFT_BASED" ? { driftThreshold } : {}),
      autoApprove,
      enabled: true,
      createdAt: new Date(),
      createdBy: "advisor@instant.com",
    };

    setRules((prev) => [...prev, newRule]);
    setIsCreateDialogOpen(false);
    setNewRuleName("");
    setNewRuleType("TIME_BASED");
    setDriftThreshold(15);
    setSchedule("monthly");
    setAutoApprove(false);
  };

  const getScheduleCron = (schedule: string): string => {
    switch (schedule) {
      case "daily":
        return "0 9 * * *";
      case "weekly":
        return "0 9 * * 1";
      case "monthly":
        return "0 9 1 * *";
      case "quarterly":
        return "0 9 1 1,4,7,10 *";
      default:
        return "0 9 1 * *";
    }
  };

  const getScheduleLabel = (cron: string): string => {
    if (cron === "0 9 * * *") return "Daily at 9:00 AM";
    if (cron === "0 9 * * 1") return "Weekly on Monday at 9:00 AM";
    if (cron === "0 9 1 * *") return "Monthly on the 1st at 9:00 AM";
    if (cron === "0 9 1 1,4,7,10 *") return "Quarterly at 9:00 AM";
    return cron;
  };

  const RuleCard = ({ rule }: { rule: RebalancingRule }) => (
    <Card className={!rule.enabled ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {rule.type === "TIME_BASED" ? (
              <Clock className="h-4 w-4 text-blue-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-amber-600" />
            )}
            {rule.name}
          </CardTitle>
          <CardDescription>
            {rule.type === "TIME_BASED"
              ? getScheduleLabel(rule.schedule || "")
              : `Triggers when drift exceeds ${rule.driftThreshold}%`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={rule.enabled ? "default" : "secondary"}>
            {rule.enabled ? "Active" : "Disabled"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Rule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleRuleEnabled(rule.ruleId)}>
                <Power className="mr-2 h-4 w-4" />
                {rule.enabled ? "Disable" : "Enable"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run Now
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Rule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Scope</p>
            <p className="font-medium capitalize">{rule.scope}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Auto-Approve</p>
            <p className="font-medium">{rule.autoApprove ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Triggered</p>
            <p className="font-medium">
              {rule.lastTriggeredAt ? formatDate(rule.lastTriggeredAt) : "Never"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rebalancing Rules</h1>
          <p className="text-muted-foreground mt-1">
            Configure automated portfolio rebalancing triggers
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Rebalancing Rule</DialogTitle>
              <DialogDescription>
                Set up an automated trigger for portfolio rebalancing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  placeholder="Enter rule name..."
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                />
              </div>

              <Tabs
                value={newRuleType}
                onValueChange={(v) => setNewRuleType(v as "TIME_BASED" | "DRIFT_BASED")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="TIME_BASED">
                    <Clock className="mr-2 h-4 w-4" />
                    Time-Based
                  </TabsTrigger>
                  <TabsTrigger value="DRIFT_BASED">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Drift-Based
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="TIME_BASED" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Select value={schedule} onValueChange={setSchedule}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                        <SelectItem value="monthly">Monthly (1st)</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="DRIFT_BASED" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Drift Threshold</Label>
                      <span className="text-sm font-medium">{driftThreshold}%</span>
                    </div>
                    <Slider
                      value={[driftThreshold]}
                      onValueChange={([value]) => setDriftThreshold(value)}
                      min={5}
                      max={50}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Rule will trigger when any account&apos;s overall drift exceeds this threshold
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Approve Proposals</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically approve generated proposals
                  </p>
                </div>
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule} disabled={!newRuleName.trim()}>
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">
              {rules.filter((r) => r.enabled).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time-Based</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeBasedRules.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled triggers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drift-Based</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driftBasedRules.length}</div>
            <p className="text-xs text-muted-foreground">Threshold triggers</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules Lists */}
      <div className="space-y-6">
        {/* Time-Based Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Time-Based Rules</h2>
          </div>
          {timeBasedRules.length > 0 ? (
            <div className="grid gap-4">
              {timeBasedRules.map((rule) => (
                <RuleCard key={rule.ruleId} rule={rule} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No time-based rules configured.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Drift-Based Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold">Drift-Based Rules</h2>
          </div>
          {driftBasedRules.length > 0 ? (
            <div className="grid gap-4">
              {driftBasedRules.map((rule) => (
                <RuleCard key={rule.ruleId} rule={rule} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No drift-based rules configured.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Triggers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rule Triggers</CardTitle>
          <CardDescription>History of rebalancing rule executions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Triggered At</TableHead>
                <TableHead>Accounts Affected</TableHead>
                <TableHead>Proposals Generated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules
                .filter((r) => r.lastTriggeredAt)
                .sort((a, b) => (b.lastTriggeredAt?.getTime() || 0) - (a.lastTriggeredAt?.getTime() || 0))
                .map((rule) => (
                  <TableRow key={rule.ruleId}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.type === "TIME_BASED" ? (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Time
                          </>
                        ) : (
                          <>
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Drift
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(rule.lastTriggeredAt!)}</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              {rules.filter((r) => r.lastTriggeredAt).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No rules have been triggered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
