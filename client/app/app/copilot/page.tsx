"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Send,
  Loader2,
  Check,
  X,
  AlertCircle,
  Zap,
  ArrowRight,
  History,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCopilot } from "@/lib/hooks/use-copilot";
import type { CommandPlan } from "@/lib/api/copilot";

interface ConversationItem {
  id: string;
  type: "user" | "copilot";
  content: string;
  plan?: CommandPlan;
  timestamp: Date;
  status?: "pending" | "approved" | "rejected" | "executed";
}

export default function CopilotPage() {
  const router = useRouter();
  const copilot = useCopilot("user");
  const [input, setInput] = React.useState("");
  const [conversation, setConversation] = React.useState<ConversationItem[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when conversation updates
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || copilot.isProposing) return;

    const userMessage: ConversationItem = {
      id: crypto.randomUUID(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const plan = await copilot.propose(input.trim());

      const copilotMessage: ConversationItem = {
        id: plan.planId,
        type: "copilot",
        content: plan.rationale.summary,
        plan,
        timestamp: new Date(),
        status: "pending",
      };

      setConversation((prev) => [...prev, copilotMessage]);
    } catch (error) {
      const errorMessage: ConversationItem = {
        id: crypto.randomUUID(),
        type: "copilot",
        content:
          error instanceof Error
            ? error.message
            : "Failed to process your request. Please try again.",
        timestamp: new Date(),
      };

      setConversation((prev) => [...prev, errorMessage]);
    }
  };

  // Handle plan approval and execution
  const handleApprove = async (item: ConversationItem) => {
    if (!item.plan) return;

    // Update status to show we're processing
    setConversation((prev) =>
      prev.map((c) =>
        c.id === item.id ? { ...c, status: "approved" as const } : c
      )
    );

    try {
      // If it's a navigation-only plan
      if (item.plan.route && item.plan.commands.length === 0) {
        const url = item.plan.queryParams
          ? `${item.plan.route}?${new URLSearchParams(item.plan.queryParams).toString()}`
          : item.plan.route;
        router.push(url);
        setConversation((prev) =>
          prev.map((c) =>
            c.id === item.id ? { ...c, status: "executed" as const } : c
          )
        );
        return;
      }

      // Execute commands
      await copilot.execute();
      setConversation((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, status: "executed" as const } : c
        )
      );

      // Navigate if there's a route
      if (item.plan.route) {
        const url = item.plan.queryParams
          ? `${item.plan.route}?${new URLSearchParams(item.plan.queryParams).toString()}`
          : item.plan.route;
        router.push(url);
      }
    } catch (error) {
      console.error("Failed to execute:", error);
      setConversation((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, status: "pending" as const } : c
        )
      );
    }
  };

  // Handle plan rejection
  const handleReject = async (item: ConversationItem) => {
    if (!item.plan) return;

    await copilot.reject("User rejected the proposal");
    setConversation((prev) =>
      prev.map((c) =>
        c.id === item.id ? { ...c, status: "rejected" as const } : c
      )
    );
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500";
    if (confidence >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };

  // Render a single conversation item
  const renderConversationItem = (item: ConversationItem) => {
    if (item.type === "user") {
      return (
        <div key={item.id} className="flex justify-end mb-4">
          <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg px-4 py-3">
            <p className="text-sm">{item.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {item.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // Copilot message
    return (
      <div key={item.id} className="flex justify-start mb-4">
        <div className="max-w-[85%]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">AI Copilot</span>
            <span className="text-xs text-muted-foreground">
              {item.timestamp.toLocaleTimeString()}
            </span>
          </div>

          <div className="bg-secondary/50 rounded-lg border border-border/50 overflow-hidden">
            <div className="p-4">
              <p className="text-sm text-foreground mb-2">{item.content}</p>

              {item.plan && (
                <>
                  {item.plan.rationale.reasoning && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {item.plan.rationale.reasoning}
                    </p>
                  )}

                  {item.plan.route && (
                    <div className="flex items-center gap-2 py-2 border-t border-border/50">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">
                        Navigate to {item.plan.route}
                      </span>
                    </div>
                  )}

                  {item.plan.commands.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Commands
                      </p>
                      <div className="space-y-1.5">
                        {item.plan.commands.map((cmd, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm"
                          >
                            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-mono text-xs">
                              {cmd.commandType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.plan.assumptions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Assumptions
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {item.plan.assumptions.map((assumption, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground/50">-</span>
                            <span>{assumption}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.plan.expectedEvents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Expected Events
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.plan.expectedEvents.map((event, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Confidence:{" "}
                      <span
                        className={`font-medium ${getConfidenceColor(item.plan.confidence)}`}
                      >
                        {Math.round(item.plan.confidence * 100)}%
                      </span>
                    </div>

                    {item.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item)}
                          disabled={copilot.isExecuting}
                        >
                          {copilot.isExecuting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              {item.plan.commands.length > 0
                                ? "Execute"
                                : "Navigate"}
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {item.status === "approved" && (
                      <Badge variant="secondary" className="text-xs">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Executing...
                      </Badge>
                    )}

                    {item.status === "executed" && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-500/10 text-green-500 border-green-500/20"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Executed
                      </Badge>
                    )}

                    {item.status === "rejected" && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-red-500/10 text-red-500 border-red-500/20"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Example prompts
  const examplePrompts = [
    "Go to the order blotter",
    "Create a buy order for 100 units of T-Note",
    "Run portfolio optimization for account ABC123",
    "Show me accounts with high drift",
    "Navigate to compliance rules",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Copilot</h1>
            <p className="text-sm text-muted-foreground">
              Natural language interface for trading operations
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {conversation.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              How can I help you today?
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
              I can help you navigate the system, create orders, run
              optimizations, and more. Just describe what you want to do in
              plain English.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="flex items-center gap-3 p-4 text-left bg-secondary/50 hover:bg-secondary/70 rounded-lg border border-border/50 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Conversation view
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="px-6 py-4 space-y-4">
              {conversation.map(renderConversationItem)}

              {copilot.isProposing && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3 border border-border/50">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input area */}
      <div className="border-t px-6 py-4 bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to do..."
            className="flex-1"
            disabled={copilot.isProposing}
          />
          <Button
            type="submit"
            disabled={!input.trim() || copilot.isProposing}
          >
            {copilot.isProposing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          The copilot will generate a plan for your approval before executing
          any actions.
        </p>
      </div>
    </div>
  );
}
