# Copilot Command Menu Implementation Specification

> **Copilot Command Menu** — A smart, context-aware command palette with liquid glass UI for navigation, actions, and AI-powered assistance in Instant.

---

## 1. Overview

The Copilot Command Menu enables advisors to:
- Navigate quickly to any page or subpage using keyboard shortcuts
- Trigger context-specific actions based on current page
- Access AI-powered agent mode for natural language commands
- Experience a premium liquid glass UI aesthetic
- Execute commands with minimal friction

**Core Principle**: The command menu is a super-smart command palette (Command+K / Cmd+K), not a separate subpage. It overlays the application and provides quick access to navigation and actions with optional AI assistance.

**Trigger**: Global keyboard shortcut `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)

---

## 2. Core Features

### 2.1 Command Menu Interface

**Purpose**: Main command menu overlay with liquid glass effect.

#### Activation
- **Keyboard Shortcut**: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
- **Visual Trigger**: Command bar button in header
- **Overlay**: Modal/dialog overlay on top of current page
- **Focus**: Automatically focus input field on open

#### Liquid Glass Effect
- **Visual Style**: Premium liquid glass aesthetic based on [kube.io implementation](https://kube.io/blog/liquid-glass-css-svg/)
- **Implementation**:
  - SVG displacement map using `feDisplacementMap`
  - Convex squircle bezel profile (soft transition)
  - Displacement magnitude calculated from surface function
  - Background content visible through glass, refracted
  - Specular highlight (subtle light reflection)
  - Semi-transparent white/light overlay
  - Rounded corners (squircle preferred)
- **Technical Details**:
  - SVG filters (`<filter>` with `feDisplacementMap`)
  - CSS `backdrop-filter` for blur (Chrome, fallback for others)
  - Surface function: Convex Squircle `y = (1 - (1-x)^4)^(1/4)`
  - Displacement vector field: Radial from border
- **Performance**: Pre-calculate displacement maps, cache SVG filter definitions

#### Menu Structure
- **Input Field**: Search/command input (glass effect container)
- **Results List**: Scrollable list of matching commands
- **Grouping**: Commands grouped by category (Navigation, Actions, Agent Mode)
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select, Escape to close

---

### 2.2 Navigation Commands

**Purpose**: Quick navigation to pages and subpages throughout the application.

#### Page Navigation
Commands to navigate to main pages:
- **Dashboard** → `/app`
- **OMS** → `/app/oms/orders`
- **EMS** → `/app/ems/executions`
- **PMS Households** → `/app/pms/households`
- **PMS Accounts** → `/app/pms/accounts`
- **PMS Models** → `/app/pms/models`
- **PMS Targets** → `/app/pms/targets`
- **PMS Optimization** → `/app/pms/optimization`
- **PMS Drift** → `/app/pms/drift`
- **PMS Rebalancing** → `/app/pms/rebalancing`
- **Compliance Rules** → `/app/compliance/rules`
- **Compliance Violations** → `/app/compliance/violations`
- **Market Data Instruments** → `/app/marketdata/instruments`
- **Market Data Curves** → `/app/marketdata/curves`
- **Market Data Pricing** → `/app/marketdata/pricing`
- **Event Timeline** → `/app/events/timeline`
- **Event Replay** → `/app/events/replay`

#### Subpage Navigation
Commands to navigate to specific subpages with parameters:
- **Order Detail** → `/app/oms/orders/:id` (requires order ID search/selection)
- **Account Detail** → `/app/pms/accounts/:id` (requires account search/selection)
- **Household Detail** → `/app/pms/households/:id` (requires household search/selection)
- **Proposal Detail** → `/app/pms/proposals/:id` (requires proposal search/selection)
- **Rule Detail** → `/app/compliance/rules/:id` (requires rule search/selection)
- **Execution Detail** → `/app/ems/executions/:id` (requires execution search/selection)
- **Instrument Detail** → `/app/marketdata/instruments/:cusip` (requires CUSIP search)
- **Event Detail** → `/app/events/:eventId` (requires event ID search)

#### Search-First Navigation
For subpage navigation with IDs:
- Type command (e.g., "order", "account")
- Show search input for ID/name
- Filter results as user types
- Navigate to selected item

---

### 2.3 Context-Specific Actions

**Purpose**: Trigger actions specific to the current page context.

#### PMS Context Actions
- **On Rebalancing Page** (`/app/pms/rebalancing`):
  - "Trigger Rebalancing" → Triggers rebalancing workflow
  - "Create Rebalancing Rule" → Navigate to rule creation
  - "View Rebalancing History" → Show history
  
- **On Account Detail Page** (`/app/pms/accounts/:id`):
  - "Run Optimization" → Navigate to optimization with account pre-filled
  - "View Positions" → Scroll to positions section
  - "View Analytics" → Scroll to analytics section
  - "Edit Targets" → Navigate to target configuration for account
  
- **On Household Detail Page** (`/app/pms/households/:id`):
  - "Run Optimization" → Navigate to optimization with household pre-filled
  - "Add Account" → Navigate to account creation
  - "View Aggregated Positions" → Scroll to positions
  
- **On Optimization Page** (`/app/pms/optimization`):
  - "Run Optimization" → Execute optimization with current inputs
  - "View Proposal" → Navigate to generated proposal

#### Compliance Context Actions
- **On Rules Page** (`/app/compliance/rules`):
  - "Create Rule" → Navigate to rule creation
  - "Test Rule" → Open rule testing dialog
  
- **On Rule Detail Page** (`/app/compliance/rules/:id`):
  - "Test Rule" → Open rule testing dialog with rule pre-loaded
  - "Edit Rule" → Navigate to rule editing
  - "View Violations" → Filter violations view to this rule
  - "Enable/Disable Rule" → Toggle rule status
  
- **On Violations Page** (`/app/compliance/violations`):
  - "View Rule" → Navigate to rule detail (if violation selected)
  - "Resolve Violation" → Mark violation as resolved

#### OMS Context Actions
- **On Orders Page** (`/app/oms/orders`):
  - "Create Order" → Navigate to order creation
  - "Upload Orders" → Navigate to bulk upload
  - "Approve Orders" → Batch approve selected orders
  
- **On Order Detail Page** (`/app/oms/orders/:id`):
  - "Approve Order" → Approve order (if pending)
  - "Reject Order" → Reject order (if pending)
  - "Cancel Order" → Cancel order
  - "Amend Order" → Navigate to order amendment
  - "Send to EMS" → Send order to EMS (if approved)
  - "View Execution" → Navigate to execution detail (if filled)

#### EMS Context Actions
- **On Executions Page** (`/app/ems/executions`):
  - "View Execution Detail" → Navigate to execution detail (requires selection)
  
- **On Execution Detail Page** (`/app/ems/executions/:id`):
  - "View Order" → Navigate to related order
  - "View Settlement" → Navigate to settlement details

#### Market Data Context Actions
- **On Pricing Page** (`/app/marketdata/pricing`):
  - "Change As-of Date" → Open as-of date selector
  - "Export Grid" → Export market grid to CSV
  - "View Curve" → Navigate to curve viewer for as-of date
  
- **On Instrument Detail Page** (`/app/marketdata/instruments/:cusip`):
  - "View Positions" → Navigate to PMS positions view filtered by CUSIP
  - "Create Order" → Navigate to order creation with CUSIP pre-filled

#### Event Studio Context Actions
- **On Timeline Page** (`/app/events/timeline`):
  - "Filter by Aggregate" → Open aggregate filter
  - "Export Events" → Export filtered events
  - "View Replay" → Navigate to replay interface
  
- **On Event Detail Page** (`/app/events/:eventId`):
  - "View Aggregate" → Navigate to aggregate entity detail
  - "View Correlation Chain" → Filter timeline to correlation ID

---

### 2.4 Agent Mode

**Purpose**: AI-powered natural language command execution (demo mode initially).

#### Activation
- **Trigger**: Hit Enter in command menu without selecting any option
- **Visual Transition**: Command menu transforms to agent mode interface
- **Glass Effect**: Maintains liquid glass aesthetic in agent mode

#### Agent Mode Interface
- **Input Field**: Natural language input (e.g., "Create an order for account ABC-123")
- **Response Display**: Agent's interpretation and proposed actions
- **Action Preview**: Show what actions will be taken
- **Approve/Cancel**: Buttons to approve or cancel agent's proposal

#### Demo Implementation (Initial)
- **No Real AI**: Use predefined patterns and keyword matching
- **Simulated Responses**: Hardcoded responses for common commands
- **Navigation Actions**: Parse natural language for navigation commands
- **Action Simulation**: Show preview of actions without actual execution
- **Examples**:
  - "Go to orders" → Navigate to `/app/oms/orders`
  - "Show account ABC-123" → Navigate to `/app/pms/accounts/ABC-123`
  - "Create order" → Navigate to `/app/oms/create`
  - "Run optimization for account XYZ" → Navigate to optimization with account pre-filled

#### Future AI Integration
- Replace demo with actual AI service
- Natural language → Command plan generation
- Command validation and execution
- Full DraftCommandPlan support (from technical spec)

---

### 2.5 Command Search & Filtering

**Purpose**: Fast, intuitive command discovery.

#### Search Behavior
- **Fuzzy Search**: Match commands by keywords, not exact matches
- **Prefix Matching**: Match commands starting with query
- **Category Filtering**: Filter by category (Navigation, Actions, Agent)
- **Context Filtering**: Show only commands relevant to current page
- **Recent Commands**: Show recently used commands at top

#### Search Results
- **Grouped Results**: Group by category
- **Highlight Matches**: Highlight matching text in results
- **Keyboard Navigation**: Arrow keys to navigate results
- **Enter to Execute**: Execute selected command
- **Escape to Close**: Close command menu

#### Command Metadata
Each command has:
- **Label**: Display name
- **Description**: Brief description (shown in results)
- **Icon**: Visual icon (optional)
- **Category**: Navigation / Action / Agent
- **Context**: Pages where command is available
- **Keywords**: Search keywords (for fuzzy matching)
- **Shortcut**: Keyboard shortcut (if applicable)

---

## 3. Data Models

### 3.1 Command Definition (TypeScript interface)

```typescript
interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: 'navigation' | 'action' | 'agent';
  context?: string[]; // Routes where command is available
  keywords: string[]; // Search keywords
  execute: (context: CommandContext) => void | Promise<void>;
  shortcut?: string; // Keyboard shortcut
}

interface CommandContext {
  currentRoute: string;
  routeParams: Record<string, string>;
  queryParams: Record<string, string>;
}
```

### 3.2 Navigation Command

```typescript
interface NavigationCommand extends Command {
  category: 'navigation';
  route: string; // Target route
  params?: Record<string, string>; // Route parameters
}
```

### 3.3 Action Command

```typescript
interface ActionCommand extends Command {
  category: 'action';
  action: string; // Action identifier
  requiresSelection?: boolean; // Whether selection is required
  requiresConfirmation?: boolean; // Whether confirmation is required
}
```

### 3.4 Agent Command (Future)

```typescript
interface AgentCommand extends Command {
  category: 'agent';
  // Future: AI service integration
}
```

---

## 4. User Flows

### 4.1 Navigate to Page
1. User presses `Cmd+K` → Command menu opens
2. User types "orders" → Results filter to show "OMS Orders"
3. User presses Enter or clicks result → Navigate to `/app/oms/orders`
4. Command menu closes

### 4.2 Navigate to Subpage with Search
1. User presses `Cmd+K` → Command menu opens
2. User types "order" → Results show "Order Detail" with search input
3. User enters order ID or searches → Results filter to matching orders
4. User selects order → Navigate to `/app/oms/orders/:id`
5. Command menu closes

### 4.3 Trigger Context Action
1. User is on `/app/pms/rebalancing` page
2. User presses `Cmd+K` → Command menu opens
3. Context-specific actions appear (e.g., "Trigger Rebalancing")
4. User types "trigger" → Results filter to show "Trigger Rebalancing"
5. User presses Enter → Action executes
6. Command menu closes

### 4.4 Agent Mode (Demo)
1. User presses `Cmd+K` → Command menu opens
2. User types "create order for account ABC"
3. User presses Enter without selecting option → Agent mode activates
4. Agent mode shows: "I'll navigate to order creation for account ABC-123"
5. User clicks "Approve" → Navigate to `/app/oms/create?accountId=ABC-123`
6. Agent mode closes

---

## 5. Technical Requirements

### 5.1 Component Structure
- **CommandMenu Component**: Main command menu overlay
- **CommandInput Component**: Search input with glass effect
- **CommandResults Component**: Results list with keyboard navigation
- **CommandGroup Component**: Grouped results by category
- **CommandItem Component**: Individual command item
- **AgentMode Component**: Agent mode interface (when activated)

### 5.2 Liquid Glass Implementation
- **SVG Filters**: Implement displacement map filter
- **CSS Styling**: Apply glass effect styles
- **Backdrop Blur**: Use `backdrop-filter` with fallback
- **Performance**: Optimize for 60fps (pre-calculate, cache)
- **Browser Compatibility**: Chrome (full effect), Safari/Firefox (fallback blur)

### 5.3 Command Registry
- **Command Registration**: Register commands at application startup
- **Context Resolution**: Resolve available commands based on current route
- **Command Execution**: Execute commands with proper context
- **Navigation**: Integrate with Next.js router

### 5.4 Keyboard Handling
- **Global Shortcut**: `Cmd+K` / `Ctrl+K` to open
- **Keyboard Navigation**: Arrow keys, Enter, Escape
- **Focus Management**: Manage focus between input and results
- **Prevent Default**: Prevent default browser behavior for shortcuts

### 5.5 Search Implementation
- **Fuzzy Search**: Use fuzzy search library (e.g., `fuse.js`)
- **Indexing**: Index commands by keywords, labels, descriptions
- **Performance**: Fast search results (< 100ms)
- **Debouncing**: Debounce search input (optional, for performance)

### 5.6 Context Awareness
- **Route Detection**: Detect current route and route parameters
- **Context Commands**: Filter commands based on current page
- **Dynamic Commands**: Generate commands based on current page state
- **Selection Context**: Use selected items (e.g., selected order) in commands

---

## 6. Integration Points

### 6.1 Navigation Integration
- **Next.js Router**: Use Next.js router for navigation
- **Route Generation**: Generate routes with parameters
- **Query Parameters**: Support query parameters in navigation

### 6.2 Action Integration
- **API Calls**: Integrate with backend APIs for actions
- **State Management**: Update application state after actions
- **Error Handling**: Handle action errors gracefully

### 6.3 Agent Integration (Future)
- **AI Service**: Integrate with AI service for natural language processing
- **Command Plan Generation**: Generate command plans from natural language
- **Approval Workflow**: Implement approval workflow for agent actions
- **Event Emission**: Emit `AIDraftProposed`, `AIDraftApproved` events

---

## 7. UI/UX Considerations

### 7.1 Liquid Glass Aesthetic
- **Premium Feel**: High-quality glass effect for premium feel
- **Visual Hierarchy**: Glass draws attention to command menu
- **Background Visibility**: Background content visible through glass (refracted)
- **Consistency**: Glass effect consistent across command menu components

### 7.2 Keyboard-First Design
- **Keyboard Shortcuts**: All actions accessible via keyboard
- **Visual Feedback**: Highlight selected command
- **Fast Navigation**: Quick navigation without mouse

### 7.3 Performance
- **Fast Open**: Command menu opens instantly (< 100ms)
- **Fast Search**: Search results appear quickly (< 100ms)
- **Smooth Animations**: Smooth open/close animations
- **Optimized Rendering**: Efficient rendering of results list

### 7.4 Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: Proper ARIA labels and roles
- **Focus Management**: Clear focus indicators
- **Error Messages**: Clear error messages for failed actions

---

## 8. Mock Data & Demo

### 8.1 Command Definitions
For initial implementation, provide:
- 20-30 navigation commands (all main pages and common subpages)
- 15-20 context-specific action commands
- Demo agent mode with 5-10 predefined patterns

### 8.2 Demo Agent Responses
Hardcoded responses for:
- Navigation commands ("go to X", "show Y")
- Action commands ("create X", "run Y")
- Search commands ("find account X", "show order Y")

---

## 9. Future Enhancements

- **Real AI Integration**: Replace demo with actual AI service
- **Command History**: Persist command history (localStorage)
- **Command Favorites**: Allow users to favorite commands
- **Custom Commands**: Allow users to create custom commands
- **Command Macros**: Support multi-step command sequences
- **Voice Input**: Support voice commands (optional)
- **Command Analytics**: Track command usage for insights

---

