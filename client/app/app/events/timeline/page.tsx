"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Link2,
  MessageSquare,
  Copy,
  Download,
  List,
  LayoutGrid,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  formatDateTime,
  formatRelativeTime,
  getAggregateColor,
  getModuleColor,
  getModuleLabel,
} from "@/lib/events/ui";
import { fetchEventTimeline } from "@/lib/events/api";
import type {
  EventModule,
  AggregateType,
  ActorRole,
  EventFilters,
  EventGroupBy,
  TimelineViewMode,
  EventTimelineItem,
} from "@/lib/events/types";

const modules: EventModule[] = ["marketdata", "pricing", "oms", "ems", "pms", "compliance", "copilot"];
const aggregateTypes: AggregateType[] = ["Order", "Account", "Household", "Proposal", "Execution", "Rule", "Instrument", "YieldCurve", "Model"];
const actorRoles: ActorRole[] = ["user", "system", "copilot", "scheduler"];

export default function EventTimelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const initialHasExplanation = searchParams.get("hasExplanation") === "true" ? true : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModules, setSelectedModules] = useState<EventModule[]>([]);
  const [selectedAggregateTypes, setSelectedAggregateTypes] = useState<AggregateType[]>([]);
  const [selectedActorRoles, setSelectedActorRoles] = useState<ActorRole[]>([]);
  const [aggregateId, setAggregateId] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [hasExplanation, setHasExplanation] = useState<boolean | undefined>(initialHasExplanation);
  const [groupBy, setGroupBy] = useState<EventGroupBy>("none");
  const [viewMode, setViewMode] = useState<TimelineViewMode>("vertical");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [eventsData, setEventsData] = useState<EventTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await fetchEventTimeline();
        if (!active) return;
        setEventsData(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  const filters: EventFilters = useMemo(() => ({
    module: selectedModules.length > 0 ? selectedModules : undefined,
    aggregateType: selectedAggregateTypes.length > 0 ? selectedAggregateTypes : undefined,
    actorRole: selectedActorRoles.length > 0 ? selectedActorRoles : undefined,
    aggregateId: aggregateId || undefined,
    correlationId: correlationId || undefined,
    hasExplanation,
    searchQuery: searchQuery || undefined,
  }), [selectedModules, selectedAggregateTypes, selectedActorRoles, aggregateId, correlationId, hasExplanation, searchQuery]);

  const events = useMemo(() => {
    return eventsData.filter((event) => {
      const matchesModule =
        !filters.module || filters.module.length === 0 || filters.module.includes(event.module);
      const matchesAggregateType =
        !filters.aggregateType || filters.aggregateType.length === 0 ||
        filters.aggregateType.includes(event.aggregate.type);
      const matchesActorRole =
        !filters.actorRole || filters.actorRole.length === 0 ||
        filters.actorRole.includes(event.actor.role);
      const matchesAggregateId = !filters.aggregateId || event.aggregate.id === filters.aggregateId;
      const matchesCorrelation = !filters.correlationId || event.correlationId === filters.correlationId;
      const matchesExplanation =
        filters.hasExplanation === undefined || event.hasExplanation === filters.hasExplanation;
      const matchesSearch =
        !filters.searchQuery ||
        event.eventType.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        event.summary.toLowerCase().includes(filters.searchQuery.toLowerCase());

      return (
        matchesModule &&
        matchesAggregateType &&
        matchesActorRole &&
        matchesAggregateId &&
        matchesCorrelation &&
        matchesExplanation &&
        matchesSearch
      );
    });
  }, [eventsData, filters]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading events…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  const groupedEvents = useMemo(() => {
    if (groupBy === "none") {
      return { "All Events": events };
    }

    return events.reduce((groups, event) => {
      let key: string;
      switch (groupBy) {
        case "module":
          key = getModuleLabel(event.module);
          break;
        case "aggregateType":
          key = event.aggregate.type;
          break;
        case "correlationId":
          key = event.correlationId || "No Correlation";
          break;
        case "date":
          key = event.occurredAt.toDateString();
          break;
        default:
          key = "All Events";
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
      return groups;
    }, {} as Record<string, EventTimelineItem[]>);
  }, [events, groupBy]);

  const toggleModule = (module: EventModule) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  const toggleAggregateType = (type: AggregateType) => {
    setSelectedAggregateTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleActorRole = (role: ActorRole) => {
    setSelectedActorRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedModules([]);
    setSelectedAggregateTypes([]);
    setSelectedActorRoles([]);
    setAggregateId("");
    setCorrelationId("");
    setHasExplanation(undefined);
  };

  const hasFilters = searchQuery || selectedModules.length > 0 || selectedAggregateTypes.length > 0 ||
    selectedActorRoles.length > 0 || aggregateId || correlationId || hasExplanation !== undefined;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Timeline</h1>
          <p className="text-muted-foreground mt-1">
            View and filter events from the event store
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "vertical" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("vertical")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
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
                placeholder="Search events..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Module
                  {selectedModules.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedModules.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {modules.map((module) => (
                  <DropdownMenuCheckboxItem
                    key={module}
                    checked={selectedModules.includes(module)}
                    onCheckedChange={() => toggleModule(module)}
                  >
                    <Badge className={getModuleColor(module)}>
                      {getModuleLabel(module)}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Aggregate
                  {selectedAggregateTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedAggregateTypes.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {aggregateTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedAggregateTypes.includes(type)}
                    onCheckedChange={() => toggleAggregateType(type)}
                  >
                    <Badge className={getAggregateColor(type)} variant="outline">
                      {type}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Actor
                  {selectedActorRoles.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedActorRoles.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {actorRoles.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={selectedActorRoles.includes(role)}
                    onCheckedChange={() => toggleActorRole(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={hasExplanation ? "default" : "outline"}
              size="sm"
              onClick={() => setHasExplanation(hasExplanation ? undefined : true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              With Explanation
            </Button>

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as EventGroupBy)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="module">Group by Module</SelectItem>
                <SelectItem value="aggregateType">Group by Aggregate</SelectItem>
                <SelectItem value="correlationId">Group by Correlation</SelectItem>
                <SelectItem value="date">Group by Date</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
            <Input
              placeholder="Aggregate ID..."
              className="w-[200px]"
              value={aggregateId}
              onChange={(e) => setAggregateId(e.target.value)}
            />
            <Input
              placeholder="Correlation ID..."
              className="w-[200px]"
              value={correlationId}
              onChange={(e) => setCorrelationId(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Showing {events.length} events
          {groupBy !== "none" && ` in ${Object.keys(groupedEvents).length} groups`}
        </span>
      </div>

      {/* Timeline */}
      {Object.entries(groupedEvents).map(([groupName, groupEvents]) => (
        <Card key={groupName}>
          {groupBy !== "none" && (
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {groupName}
                <span className="text-muted-foreground font-normal ml-2">
                  ({groupEvents.length} events)
                </span>
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={groupBy !== "none" ? "pt-0" : "pt-6"}>
            <div className={viewMode === "vertical" ? "space-y-4" : "space-y-2"}>
              {groupEvents.map((event, index) => (
                <Collapsible
                  key={event.eventId}
                  open={expandedEvents.has(event.eventId)}
                  onOpenChange={() => toggleEventExpand(event.eventId)}
                >
                  <div className={viewMode === "vertical" ? "relative pl-8" : ""}>
                    {viewMode === "vertical" && (
                      <>
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                        <div className={`absolute left-1.5 top-4 h-3 w-3 rounded-full border-2 bg-background ${
                          event.hasExplanation ? "border-orange-500" : "border-primary"
                        }`} />
                      </>
                    )}

                    <CollapsibleTrigger asChild>
                      <div className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        expandedEvents.has(event.eventId) ? "bg-muted/30" : ""
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {expandedEvents.has(event.eventId) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getModuleColor(event.module)}>
                                {getModuleLabel(event.module)}
                              </Badge>
                              <span className="font-mono text-sm font-medium">
                                {event.eventType}
                              </span>
                              {event.hasExplanation && (
                                <MessageSquare className="h-4 w-4 text-orange-500" />
                              )}
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(event.occurredAt)}
                              </span>
                              <Badge className={getAggregateColor(event.aggregate.type)} variant="outline">
                                {event.aggregate.type}
                              </Badge>
                              <span className="text-xs">
                                {event.actor.role}: {event.actor.actorId}
                              </span>
                            </div>

                            <p className="mt-2 text-sm">{event.summary}</p>

                            {event.explanation && (
                              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                                {event.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-2 p-4 border rounded-lg bg-muted/20 space-y-4">
                        {/* Event IDs */}
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-28">Event ID:</span>
                            <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                              {event.eventId}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(event.eventId)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          {event.correlationId && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-28 flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                Correlation:
                              </span>
                              <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                {event.correlationId}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCorrelationId(event.correlationId!)}
                              >
                                <Filter className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {event.causationId && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-28 flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                Causation:
                              </span>
                              <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                {event.causationId}
                              </code>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-28">Aggregate:</span>
                            <Badge className={getAggregateColor(event.aggregate.type)} variant="outline">
                              {event.aggregate.type}: {event.aggregate.id.slice(0, 8)}...
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAggregateId(event.aggregate.id)}
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-28">Timestamp:</span>
                            <span>{formatDateTime(event.occurredAt)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-28">Schema Version:</span>
                            <Badge variant="outline">v{event.schemaVersion}</Badge>
                          </div>
                        </div>

                        {/* Payload */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Payload</h4>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/app/events/${event.eventId}`)}
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            Copy Event
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {events.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
