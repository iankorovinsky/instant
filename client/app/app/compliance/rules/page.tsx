"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Shield,
  Globe,
  Building2,
  Briefcase,
  MoreHorizontal,
  Power,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  rules,
  getSeverityColor,
  getScopeColor,
  getStatusColor,
  formatDate,
  formatDateTime,
} from "@/lib/compliance/mock-data";
import type { RuleSeverity, RuleScope, RuleStatus, RuleGroupBy } from "@/lib/compliance/types";

export default function RulesPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<RuleGroupBy>("none");

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        searchQuery === "" ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.ruleKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === "all" || rule.severity === severityFilter;
      const matchesScope = scopeFilter === "all" || rule.scope === scopeFilter;
      const matchesStatus = statusFilter === "all" || rule.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesScope && matchesStatus;
    });
  }, [searchQuery, severityFilter, scopeFilter, statusFilter]);

  // Group rules if needed
  const groupedRules = useMemo(() => {
    if (groupBy === "none") {
      return { "": filteredRules };
    }

    const groups: Record<string, typeof filteredRules> = {};

    filteredRules.forEach((rule) => {
      let key = "";
      switch (groupBy) {
        case "scope":
          key = rule.scope;
          break;
        case "severity":
          key = rule.severity;
          break;
        case "status":
          key = rule.status;
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(rule);
    });

    return groups;
  }, [filteredRules, groupBy]);

  const getScopeIcon = (scope: RuleScope) => {
    switch (scope) {
      case "GLOBAL":
        return <Globe className="h-4 w-4" />;
      case "HOUSEHOLD":
        return <Building2 className="h-4 w-4" />;
      case "ACCOUNT":
        return <Briefcase className="h-4 w-4" />;
    }
  };

  // Summary stats
  const activeCount = rules.filter((r) => r.status === "ACTIVE").length;
  const blockCount = rules.filter((r) => r.severity === "BLOCK" && r.status === "ACTIVE").length;
  const warnCount = rules.filter((r) => r.severity === "WARN" && r.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Rules</h1>
          <p className="text-muted-foreground mt-1">
            Manage compliance rules across global, household, and account scopes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "all" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("all")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">All Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "ACTIVE" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("ACTIVE")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${severityFilter === "BLOCK" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => {
            setSeverityFilter("BLOCK");
            setStatusFilter("ACTIVE");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Block Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockCount}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${severityFilter === "WARN" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => {
            setSeverityFilter("WARN");
            setStatusFilter("ACTIVE");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Warn Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warnCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rules</CardTitle>
              <CardDescription>
                {filteredRules.length} rule{filteredRules.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="BLOCK">Block</SelectItem>
                  <SelectItem value="WARN">Warn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="HOUSEHOLD">Household</SelectItem>
                  <SelectItem value="ACCOUNT">Account</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as RuleGroupBy)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="scope">Group by Scope</SelectItem>
                  <SelectItem value="severity">Group by Severity</SelectItem>
                  <SelectItem value="status">Group by Status</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedRules).map(([groupKey, groupRules]) => (
            <div key={groupKey || "all"} className="mb-6 last:mb-0">
              {groupBy !== "none" && groupKey && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Badge
                    className={
                      groupBy === "severity"
                        ? getSeverityColor(groupKey as RuleSeverity)
                        : groupBy === "scope"
                        ? getScopeColor(groupKey as RuleScope)
                        : getStatusColor(groupKey as RuleStatus)
                    }
                  >
                    {groupKey}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{groupRules.length} rules</span>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Evaluations</TableHead>
                    <TableHead className="text-right">Violations</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupRules.map((rule) => (
                    <TableRow
                      key={rule.ruleId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/app/compliance/rules/${rule.ruleId}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{rule.name}</span>
                            <p className="text-xs text-muted-foreground font-mono">
                              {rule.ruleKey}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getScopeIcon(rule.scope)}
                          <div>
                            <Badge variant="outline" className={getScopeColor(rule.scope)}>
                              {rule.scope}
                            </Badge>
                            {rule.scopeName && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {rule.scopeName}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rule.status)}>
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {rule.evaluationCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={rule.violationCount > 0 ? "text-amber-600 font-medium" : ""}>
                          {rule.violationCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDate(rule.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Rule
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Power className="mr-2 h-4 w-4" />
                              {rule.status === "ACTIVE" ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={rule.evaluationCount > 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groupRules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No rules found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
