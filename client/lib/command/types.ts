// Command Menu Types

export type CommandCategory = "navigation" | "action" | "agent";

export interface CommandContext {
  currentRoute: string;
  routeParams: Record<string, string>;
  queryParams: Record<string, string>;
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: CommandCategory;
  context?: string[]; // Routes where command is available (regex patterns)
  keywords: string[];
  shortcut?: string;
  execute: (context: CommandContext, router: any) => void | Promise<void>;
}

export interface NavigationCommand extends Command {
  category: "navigation";
  route: string;
  params?: Record<string, string>;
}

export interface ActionCommand extends Command {
  category: "action";
  action: string;
  requiresSelection?: boolean;
  requiresConfirmation?: boolean;
}

export interface AgentCommand extends Command {
  category: "agent";
}

// Agent mode types
export interface AgentResponse {
  interpretation: string;
  proposedAction: string;
  route?: string;
  queryParams?: Record<string, string>;
  confidence: number;
}

// Command group for display
export interface CommandGroup {
  heading: string;
  commands: Command[];
}
