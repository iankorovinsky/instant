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
  parseAgentCommand,
  categoryLabels,
  getContextCommands,
} from "@/lib/command/commands";
import type { Command as CommandType, AgentResponse } from "@/lib/command/types";

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
  const [agentResponse, setAgentResponse] = React.useState<AgentResponse | null>(null);
  const [agentLoading, setAgentLoading] = React.useState(false);

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
      setAgentResponse(null);
    }
  }, [open]);

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

  // Activate agent mode
  const activateAgentMode = async () => {
    setAgentMode(true);
    setAgentLoading(true);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const response = parseAgentCommand(search);
    setAgentResponse(response);
    setAgentLoading(false);
  };

  // Execute agent action
  const executeAgentAction = () => {
    if (agentResponse?.route) {
      const url = agentResponse.queryParams
        ? `${agentResponse.route}?${new URLSearchParams(agentResponse.queryParams).toString()}`
        : agentResponse.route;
      router.push(url);
    }
    setOpen(false);
  };

  // Cancel agent mode
  const cancelAgentMode = () => {
    setAgentMode(false);
    setAgentResponse(null);
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
          <span className="text-xs">⌘</span>K
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
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↑↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↵</kbd>
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
                  {agentLoading ? "Thinking..." : "Here's what I understood"}
                </p>
              </div>
            </div>

            {agentLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
                <p className="text-sm text-muted-foreground">Processing your request...</p>
              </div>
            ) : agentResponse ? (
              <div className="space-y-5">
                <div className="p-5 bg-secondary/50 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {agentResponse.interpretation}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-sm">{agentResponse.proposedAction}</span>
                  </div>
                  {agentResponse.route && (
                    <p className="text-xs text-muted-foreground mt-3 font-mono bg-muted/50 px-2 py-1.5 rounded">
                      → {agentResponse.route}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="text-xs text-muted-foreground">
                    Confidence: <span className="font-medium text-foreground">{Math.round(agentResponse.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={executeAgentAction} className="flex-1" size="default">
                    <Check className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                </div>
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
                  <p className="text-muted-foreground">"Create an order"</p>
                  <p className="text-muted-foreground">"Run optimization"</p>
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
