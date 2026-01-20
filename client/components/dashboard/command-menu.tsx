"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Zap,
  PieChart,
  Users,
  Wallet,
  Layers,
  FileCheck,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Shield,
  Scale,
  AlertTriangle,
  BarChart3,
  Grid3X3,
  Activity,
  Clock,
  History,
  Plus,
  Upload,
  Download,
  GitBranch,
  Bot,
  Search,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  allCommands,
  searchCommands,
  groupCommands,
  categoryLabels,
  getContextCommands,
} from "@/lib/command/commands";
import type { Command as CommandType } from "@/lib/command/types";
import { useCopilot } from "@/lib/hooks/use-copilot";
import type { CommandPlan } from "@/lib/api/copilot";

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  PieChart: <PieChart className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Wallet: <Wallet className="h-4 w-4" />,
  Layers: <Layers className="h-4 w-4" />,
  FileCheck: <FileCheck className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  RefreshCw: <RefreshCw className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Scale: <Scale className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  Grid3X3: <Grid3X3 className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  History: <History className="h-4 w-4" />,
  Plus: <Plus className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  Download: <Download className="h-4 w-4" />,
  GitBranch: <GitBranch className="h-4 w-4" />,
};

export function CommandMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [agentMode, setAgentMode] = React.useState(false);

  // Use the copilot hook
  const copilot = useCopilot("user");

  // Create command context
  const commandContext = React.useMemo(() => ({
    currentRoute: pathname,
    routeParams: {},
    queryParams: Object.fromEntries(searchParams.entries()),
  }), [pathname, searchParams]);

  // Get available commands based on context
  const contextCommands = React.useMemo(() => {
    return getContextCommands(pathname);
  }, [pathname]);

  // Filter and group commands
  const filteredCommands = React.useMemo(() => {
    return searchCommands(search, contextCommands);
  }, [search, contextCommands]);

  const groupedCommands = React.useMemo(() => {
    return groupCommands(filteredCommands);
  }, [filteredCommands]);

  // Handle keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setAgentMode(false);
      copilot.clear();
    }
  }, [open, copilot]);

  // Handle command selection
  const handleSelect = (command: CommandType) => {
    command.execute(commandContext, router);
    setOpen(false);
  };

  // Handle Enter key for agent mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim() && filteredCommands.length === 0) {
      e.preventDefault();
      activateAgentMode();
    }
  };

  // Activate agent mode and call copilot API
  const activateAgentMode = async () => {
    setAgentMode(true);
    try {
      await copilot.propose(search, {
        currentRoute: pathname,
      });
    } catch (error) {
      console.error("Failed to get copilot response:", error);
    }
  };

  // Execute the copilot plan
  const executeAgentAction = async () => {
    const plan = copilot.currentPlan;
    if (!plan) return;

    // If it's a navigation-only plan, just navigate
    if (plan.route && plan.commands.length === 0) {
      const url = plan.queryParams
        ? `${plan.route}?${new URLSearchParams(plan.queryParams).toString()}`
        : plan.route;
      router.push(url);
      setOpen(false);
      return;
    }

    // Execute the commands
    try {
      await copilot.execute();
      // If there's a route, navigate after execution
      if (plan.route) {
        const url = plan.queryParams
          ? `${plan.route}?${new URLSearchParams(plan.queryParams).toString()}`
          : plan.route;
        router.push(url);
      }
      setOpen(false);
    } catch (error) {
      console.error("Failed to execute plan:", error);
    }
  };

  // Cancel agent mode
  const cancelAgentMode = async () => {
    await copilot.reject("User cancelled");
    setAgentMode(false);
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500";
    if (confidence >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };

  // Render command list for the plan
  const renderPlanCommands = (plan: CommandPlan) => {
    if (plan.commands.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Commands to Execute
        </p>
        <div className="space-y-1.5">
          {plan.commands.map((cmd, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm"
            >
              <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-mono text-xs">{cmd.commandType}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-lg bg-muted/50 text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search commands...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
        {!agentMode ? (
          // Normal command mode
          <div className="flex flex-col h-full">
            <div className="relative shrink-0">
              <CommandInput
                placeholder="Type a command or search..."
                value={search}
                onValueChange={setSearch}
                onKeyDown={handleKeyDown}
              />
            </div>
            <CommandList className="flex-1 overflow-y-auto px-2 py-3 min-h-0">
              <CommandEmpty className="py-12 text-center text-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No commands found</p>
                    <p className="text-muted-foreground text-xs">
                      Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to ask AI Copilot
                    </p>
                  </div>
                </div>
              </CommandEmpty>

              {/* Navigation Commands */}
              {groupedCommands.navigation && groupedCommands.navigation.length > 0 && (
                <CommandGroup heading="Navigation">
                  {groupedCommands.navigation.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      value={cmd.id}
                      onSelect={() => handleSelect(cmd)}
                      className="group flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary/80 text-primary shrink-0">
                        {cmd.icon && iconMap[cmd.icon]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-none mb-1">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono shrink-0">
                          {cmd.shortcut}
                        </kbd>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-40 group-data-[selected=true]:opacity-100 transition-opacity" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groupedCommands.navigation && groupedCommands.action && (
                <CommandSeparator className="my-3" />
              )}

              {/* Action Commands */}
              {groupedCommands.action && groupedCommands.action.length > 0 && (
                <CommandGroup heading="Actions">
                  {groupedCommands.action.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      value={cmd.id}
                      onSelect={() => handleSelect(cmd)}
                      className="group flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/80 text-accent-foreground shrink-0">
                        {cmd.icon && iconMap[cmd.icon]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-none mb-1">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      <Zap className="h-4 w-4 text-muted-foreground shrink-0 opacity-40 group-data-[selected=true]:opacity-100 transition-opacity" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            {/* Footer hint - fixed at bottom */}
            <div className="border-t shrink-0 pt-3 px-3 pb-3 bg-background">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">&#8593;&#8595;</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">&#8629;</kbd>
                    <span>Select</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">esc</kbd>
                    <span>Close</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Agent mode
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">AI Copilot</h3>
                <p className="text-sm text-muted-foreground">
                  {copilot.isProposing ? "Thinking..." : copilot.isExecuting ? "Executing..." : "Here's what I understood"}
                </p>
              </div>
            </div>

            {copilot.isProposing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Processing your request...</p>
              </div>
            ) : copilot.proposeError ? (
              <div className="space-y-5">
                <div className="p-5 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-sm text-destructive">Error</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {copilot.proposeError.message || "Failed to process your request"}
                  </p>
                </div>
                <Button variant="outline" onClick={cancelAgentMode} className="w-full">
                  Try Again
                </Button>
              </div>
            ) : copilot.currentPlan ? (
              <div className="space-y-5">
                <div className="p-5 bg-secondary/50 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {copilot.currentPlan.rationale.summary}
                  </p>

                  {copilot.currentPlan.rationale.reasoning && (
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {copilot.currentPlan.rationale.reasoning}
                    </p>
                  )}

                  {copilot.currentPlan.route && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-sm">Navigate to {copilot.currentPlan.route}</span>
                    </div>
                  )}

                  {renderPlanCommands(copilot.currentPlan)}

                  {copilot.currentPlan.assumptions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Assumptions
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {copilot.currentPlan.assumptions.map((assumption, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground/50">-</span>
                            <span>{assumption}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {copilot.currentPlan.expectedEvents.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Expected Events
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {copilot.currentPlan.expectedEvents.map((event, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="text-xs text-muted-foreground">
                    Confidence:{" "}
                    <span className={`font-medium ${getConfidenceColor(copilot.currentPlan.confidence)}`}>
                      {Math.round(copilot.currentPlan.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={executeAgentAction}
                    className="flex-1"
                    size="default"
                    disabled={copilot.isExecuting}
                  >
                    {copilot.isExecuting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {copilot.currentPlan.commands.length > 0 ? "Execute" : "Navigate"}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={cancelAgentMode} disabled={copilot.isExecuting}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {copilot.executeError && (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 mt-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">
                        {copilot.executeError.message || "Execution failed"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-6">
                  <p className="text-sm text-foreground mb-1 font-medium">
                    I couldn't understand that command
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try something like:
                  </p>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <p className="text-muted-foreground">"Go to orders"</p>
                  <p className="text-muted-foreground">"Create an order to buy 100 units of T-Note"</p>
                  <p className="text-muted-foreground">"Run optimization for account ABC123"</p>
                </div>
                <Button variant="outline" onClick={cancelAgentMode}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </CommandDialog>
    </>
  );
}
