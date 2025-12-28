"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  GitBranch,
  Link2,
  Copy,
  Download,
  ExternalLink,
  MessageSquare,
  User,
  FileText,
  ChevronRight,
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
import { Separator } from "@/components/ui/separator";
import {
  getEventById,
  getRelatedEvents,
  getModuleFromEventType,
  getModuleColor,
  getModuleLabel,
  getAggregateColor,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/events/mock-data";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { eventId } = use(params);
  const router = useRouter();

  const event = useMemo(() => getEventById(eventId), [eventId]);
  const relatedEvents = useMemo(() => getRelatedEvents(eventId), [eventId]);

  const module = event ? getModuleFromEventType(event.eventType) : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!event) {
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
              <p className="text-lg font-medium">Event not found</p>
              <p className="text-sm">Event ID: {eventId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {event.eventType}
              </h1>
              {module && (
                <Badge className={getModuleColor(module)}>
                  {getModuleLabel(module)}
                </Badge>
              )}
              {event.explanation && (
                <MessageSquare className="h-5 w-5 text-orange-500" />
              )}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDateTime(event.occurredAt)}
              <span className="text-muted-foreground">({formatRelativeTime(event.occurredAt)})</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Event
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Explanation Banner */}
      {event.explanation && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <MessageSquare className="h-5 w-5" />
              Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-900 whitespace-pre-wrap">{event.explanation}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Envelope */}
        <Card>
          <CardHeader>
            <CardTitle>Event Envelope</CardTitle>
            <CardDescription>Complete event metadata</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-muted-foreground mb-1">Event ID</dt>
                <dd className="flex items-center gap-2">
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
                </dd>
              </div>

              <div>
                <dt className="text-sm text-muted-foreground mb-1">Event Type</dt>
                <dd className="font-mono font-medium">{event.eventType}</dd>
              </div>

              <div>
                <dt className="text-sm text-muted-foreground mb-1">Occurred At</dt>
                <dd>{formatDateTime(event.occurredAt)}</dd>
              </div>

              <div>
                <dt className="text-sm text-muted-foreground mb-1">Schema Version</dt>
                <dd>
                  <Badge variant="outline">v{event.schemaVersion}</Badge>
                </dd>
              </div>

              <Separator />

              <div>
                <dt className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Actor
                </dt>
                <dd className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ID:</span>
                    <span>{event.actor.actorId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Role:</span>
                    <Badge variant="secondary">{event.actor.role}</Badge>
                  </div>
                </dd>
              </div>

              <Separator />

              <div>
                <dt className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Aggregate
                </dt>
                <dd className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getAggregateColor(event.aggregate.type)} variant="outline">
                      {event.aggregate.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {event.aggregate.id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(event.aggregate.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </dd>
              </div>

              <Separator />

              <div>
                <dt className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  Correlation ID
                </dt>
                <dd>
                  {event.correlationId ? (
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {event.correlationId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/app/events/timeline?correlationId=${event.correlationId}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Causation ID
                </dt>
                <dd>
                  {event.causationId ? (
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {event.causationId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/app/events/${event.causationId}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Payload */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payload</CardTitle>
                <CardDescription>Event data</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(event.payload, null, 2))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-[400px]">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Correlation Chain */}
      {relatedEvents.correlationChain.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Correlation Chain
                </CardTitle>
                <CardDescription>
                  {relatedEvents.correlationChain.length} events with the same correlation ID
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/events/timeline?correlationId=${event.correlationId}`}>
                  View in Timeline
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatedEvents.correlationChain.map((relEvent, index) => (
                <div
                  key={relEvent.eventId}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    relEvent.eventId === event.eventId ? "bg-primary/10 border border-primary" : "border"
                  }`}
                  onClick={() => router.push(`/app/events/${relEvent.eventId}`)}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs font-mono">{index + 1}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <Badge className={getModuleColor(relEvent.module)}>
                    {getModuleLabel(relEvent.module)}
                  </Badge>
                  <span className="font-mono text-sm">{relEvent.eventType}</span>
                  <span className="text-sm text-muted-foreground flex-1">
                    {relEvent.summary}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(relEvent.occurredAt)}
                  </span>
                  {relEvent.eventId === event.eventId && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregate Timeline */}
      {relatedEvents.aggregateTimeline.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Aggregate Timeline
                </CardTitle>
                <CardDescription>
                  {relatedEvents.aggregateTimeline.length} events for {event.aggregate.type}: {event.aggregate.id.slice(0, 8)}...
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/events/timeline?aggregateId=${event.aggregate.id}`}>
                  View in Timeline
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedEvents.aggregateTimeline.map((relEvent, index) => (
                  <TableRow
                    key={relEvent.eventId}
                    className={`cursor-pointer ${
                      relEvent.eventId === event.eventId ? "bg-primary/10" : ""
                    }`}
                    onClick={() => router.push(`/app/events/${relEvent.eventId}`)}
                  >
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{relEvent.eventType}</TableCell>
                    <TableCell>{relEvent.summary}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeTime(relEvent.occurredAt)}
                    </TableCell>
                    <TableCell>
                      {relEvent.eventId === event.eventId && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Raw Event JSON */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Raw Event</CardTitle>
              <CardDescription>Complete event envelope JSON</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-[300px]">
            {JSON.stringify(event, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
