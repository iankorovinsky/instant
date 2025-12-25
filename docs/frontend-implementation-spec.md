# Frontend Implementation Specification

REMEMBER TO USE SHADCN FOR COMPONENTS WHERE NEEDED

> **Implementation Order**: Home page / Auth → UI → Agent → Backend Systems  
> **Note**: UI will exist without backend for extended period; design for mock data and progressive enhancement.

---

## 1. Color System

### 1.1 Base Palette
- **White**: `#ffffff` - Primary background, text on dark surfaces
- **Dark Teal**: `#1d2b2d` - Primary dark color, backgrounds, text on light surfaces
- **Mint Green**: `#a7cab9` - Accent color, highlights, secondary elements

### 1.2 Semantic Colors
- **Blue**: In-progress indicators, pending states, loading states
  - Primary: `#3b82f6` (blue-500)
  - Light: `#93c5fd` (blue-300)
  - Dark: `#1e40af` (blue-700)
  
- **Green**: Success, approvals, positive states
  - Primary: `#10b981` (emerald-500)
  - Light: `#6ee7b7` (emerald-300)
  - Dark: `#047857` (emerald-700)
  
- **Red**: Negative, destructive actions, errors, rejections
  - Primary: `#ef4444` (red-500)
  - Light: `#fca5a5` (red-300)
  - Dark: `#b91c1c` (red-700)

### 1.3 Usage Guidelines
- **Backgrounds**: Use white for main content areas, `#1d2b2d` for headers/nav, `#a7cab9` sparingly for subtle accents
- **Text**: Dark teal (`#1d2b2d`) on white, white on dark teal
- **Borders**: Subtle gray (`#e5e7eb`) on light backgrounds, darker gray on dark backgrounds
- **Status Indicators**: 
  - Blue badges/icons for in-progress states
  - Green badges/icons for approved/successful states
  - Red badges/icons for rejected/error states

### 1.4 Implementation
- Define as CSS custom properties in `globals.css`
- Use Tailwind config for semantic color tokens
- Ensure sufficient contrast ratios (WCAG AA minimum)

---

## 2. Authentication & Routing Pattern

### 2.1 Route Structure
- **`/`** - Home page (public, showcases project)
  - Hero section explaining Instant
  - Feature highlights
  - Login button (top-right or CTA)
  - No authentication required to view
  
- **`/app/*`** - Application routes (protected)
  - All authenticated functionality lives under `/app`
  - Requires authentication to access
  - Redirect to `/` with login prompt if unauthenticated

### 2.2 Authentication Flow
1. User visits `/` (home page)
2. Clicks "Login" button → redirects to `/app/login` (or modal)
3. After successful login → redirects to `/app` (dashboard)
4. All `/app/*` routes check auth status
5. Logout → redirects to `/`

### 2.3 Auth Implementation Notes
- Simple email/password or OAuth (TBD)
- Session management via cookies/localStorage
- Auth state managed in React context or Zustand store
- Protected route wrapper component for `/app/*` routes
- Mock auth acceptable during initial implementation (no backend)

---

## 2.5 Advisor's Client Structure

### 2.5.1 Hierarchy
The UI is built from the **advisor's perspective**. The advisor manages their clients organized as:

```
Advisor (You)
  └── Household (Client Group)
      └── Account (Individual Account)
```

**Levels**:
1. **Household**: A client household (may contain multiple accounts)
2. **Account**: Individual investment account

### 2.5.2 UI Implications
- **Navigation**: Filter/view by household or account
- **Compliance**: Rules can be scoped globally, per-household, or per-account
- **Portfolio Management**: Aggregations at household level
- **Order Management**: Orders are associated with an account, UI shows household context
- **Context Breadcrumbs**: Show current scope (Household > Account) when drilling down

### 2.5.3 Data Relationships
- Each account belongs to exactly one household
- Orders reference accounts (which implies household)
- Compliance rules can target global, household, or account level
- Portfolio analytics can be aggregated upward (account → household)

---

## 3. Page Structure & Routes

### 3.1 Home Page (`/`)
**Purpose**: Project showcase, landing page for advisors

**Sections**:
- Hero with tagline
- Key features overview:
  - Household/account management
  - Portfolio optimization
  - Compliance rules
  - Event-sourced audit trail
- Visual demo/preview (static or animated)
- Login CTA
- Footer

**No backend required** - fully static

---

### 3.2 Application Routes (`/app/*`)

#### 3.2.1 Dashboard (`/app`)
**Purpose**: Overview, quick actions, recent activity

**Components**:
- Market date selector (as-of date)
- Quick stats cards:
  - Total Households
  - Total Accounts
  - Total AUM
  - Orders pending approval
  - Active compliance violations
- Recent orders table (last 10) with household/account context
- Recent events timeline (last 10)
- Quick action buttons:
  - Create Order
  - Run Optimization
  - View Compliance Status
  - Add New Account
- Household/Account quick selector (filter dashboard by scope)

**Mock Data**: Static JSON with sample orders, events, household/account hierarchy

---

#### 3.2.2 Order Management System (`/app/oms`)
**Purpose**: Order lifecycle management

**Sub-routes**:
- `/app/oms/orders` - Order blotter (main view)
- `/app/oms/orders/:id` - Order detail view
- `/app/oms/upload` - Bulk order upload
- `/app/oms/create` - Single order creation

**Key Components**:
- **Blotter View** (`/app/oms/orders`)
  - Table: CUSIP, Side, Quantity, Order Type, State, Account, Household, Compliance Status, Last Fill, PnL
  - Filters:
    - State
    - Account
    - Household
    - Date range
  - Group by: Household / Account (optional)
  - Actions: Create, Approve, Cancel, View Detail
  - Status indicators: Blue (pending), Green (approved/filled), Red (rejected)

- **Order Detail** (`/app/oms/orders/:id`)
  - Order information card (shows account, household context)
  - Compliance evaluation results (shows which scope-level rules evaluated)
  - Execution history (fills)
  - Event timeline
  - Actions: Approve, Reject, Cancel, Amend

**Mock Data**: Sample orders in various states (DRAFT, APPROVAL_PENDING, APPROVED, FILLED, etc.) with account/household associations

---

#### 3.2.3 Execution Management System (`/app/ems`)
**Purpose**: Execution simulation, fill analysis

**Sub-routes**:
- `/app/ems/executions` - Execution tape
- `/app/ems/executions/:id` - Execution detail with slippage decomposition

**Key Components**:
- **Execution Tape** (`/app/ems/executions`)
  - Table: Order ID, Instrument, Side, Quantity, Avg Fill Price, Slippage, Timestamp
  - Slippage breakdown visualization
  - Filter by date, order
  
- **Execution Detail** (`/app/ems/executions/:id`)
  - Fill details (clips, prices, timestamps)
  - Slippage decomposition:
    - Bucket spread component
    - Size impact
    - Limit constraint
    - Total slippage
  - Explanation text
  - Deterministic inputs display

**Mock Data**: Sample executions with fill arrays and slippage breakdowns

---

#### 3.2.4 Portfolio Management System (`/app/pms`)
**Purpose**: Holdings, targets, optimization, proposals

**Sub-routes**:
- `/app/pms/households` - Household list
- `/app/pms/households/:id` - Household detail (accounts, aggregated positions)
- `/app/pms/accounts` - Account list
- `/app/pms/accounts/:id` - Account detail (positions, analytics)
- `/app/pms/targets` - Target configuration (by household/account)
- `/app/pms/optimization` - Run optimization, view proposals
- `/app/pms/proposals/:id` - Proposal detail

**Key Components**:
- **Household List** (`/app/pms/households`)
  - Table: Household Name, Account Count, Total Market Value, Last Activity
  - Filter by name, search
  - Click to view household detail

- **Household Detail** (`/app/pms/households/:id`)
  - Household information (client name)
  - Accounts list (under this household)
  - Aggregated positions across all accounts
  - Aggregated analytics: Total Duration, Total DV01, Total Market Value
  - As-of date selector
  - Quick actions: Add account, Run optimization

- **Account List** (`/app/pms/accounts`)
  - Table: Account Name, Household, Market Value, Duration, Last Activity
  - Filter by household, search
  - Click to view account detail

- **Account Positions** (`/app/pms/accounts/:id`)
  - Account information (account name, household)
  - Cash balance
  - Positions table: CUSIP, Quantity, Avg Cost, Market Value, Duration, DV01
  - Portfolio analytics: Total Duration, Total DV01, Market Value
  - As-of date selector

- **Optimization** (`/app/pms/optimization`)
  - Scope selector: Account / Household
  - Target inputs (duration, bucket weights)
  - Run optimization button
  - Proposal preview (generated trades, predicted deltas)
  - Approve/Reject proposal actions

- **Proposal Detail** (`/app/pms/proposals/:id`)
  - Proposed trades list
  - Predicted analytics delta
  - Assumptions display
  - Approval actions

**Mock Data**: Sample households, accounts with positions, sample proposals

---

#### 3.2.5 Compliance (`/app/compliance`)
**Purpose**: Rule management, violation tracking

**Sub-routes**:
- `/app/compliance/rules` - Rule set list and editor
- `/app/compliance/violations` - Active violations/warnings
- `/app/compliance/rules/:id` - Rule detail/edit

**Key Components**:
- **Rule Editor** (`/app/compliance/rules`)
  - Rule list table with scope column
  - Create/Edit rule form:
    - Rule ID, severity (BLOCK/WARN)
    - **Scope selector**:
      - **Global**: Applies to all households/accounts
      - **Household**: Specific household, applies to all accounts in household
      - **Account**: Specific account only
    - Scope target selector (when scope is Household/Account):
      - Household dropdown (for household/account scope)
      - Account dropdown (for account scope)
    - Predicate builder (metric, operator, value)
    - Explanation template
  - Publish/Version management
  - Scope hierarchy visualization (breadcrumb showing inheritance)

- **Violations View** (`/app/compliance/violations`)
  - Table: Rule ID, Scope Level, Scope Target, Order/Account, Metric Value, Threshold, Status
  - Filter by:
    - Severity (BLOCK/WARN)
    - Scope level (Global/Household/Account)
    - Household
    - Account
  - Group by scope level option
  - Link to order/account detail
  - Show rule inheritance (e.g., "Inherited from Global rule X")

**Scope Hierarchy Notes**:
- Rules inherit down the hierarchy (Global → Household → Account)
- More specific rules override less specific ones
- UI should show which rules apply at each level
- Violations should indicate which rule level triggered the violation

**Mock Data**: Sample rules at each scope level, sample violations with scope context

---

#### 3.2.6 Market Data (`/app/marketdata`)
**Purpose**: Instrument master, curve data, evaluated pricing

**Sub-routes**:
- `/app/marketdata/instruments` - Instrument list
- `/app/marketdata/curves` - Yield curve viewer
- `/app/marketdata/pricing` - Evaluated pricing grid

**Key Components**:
- **Market Grid** (`/app/marketdata/pricing`)
  - Table: CUSIP, Type, Maturity, Coupon, Evaluated Price, Evaluated Yield, Duration, DV01
  - As-of date selector
  - Filter by type, maturity range
  - Show curve source metadata
  
- **Curve Viewer** (`/app/marketdata/curves`)
  - Yield curve visualization (line chart)
  - Tenor vs Par Yield
  - As-of date selector
  - Source metadata

**Mock Data**: Sample instruments, yield curve data

---

#### 3.2.7 Event Studio (`/app/events`)
**Purpose**: Event timeline, replay, explainability

**Sub-routes**:
- `/app/events/timeline` - Event timeline viewer
- `/app/events/replay` - Time-travel replay interface

**Key Components**:
- **Event Timeline** (`/app/events/timeline`)
  - Filter by aggregate type, aggregate ID, correlation ID
  - Timeline visualization (vertical or horizontal)
  - Event cards showing:
    - Event type, timestamp, actor
    - Payload summary
    - Explanation (if present)
    - Related events (via correlation/causation)
  - Expandable event detail
  
- **Replay Interface** (`/app/events/replay`)
  - Select as-of date (market time)
  - Select replay cutoff (system time)
  - Rebuild projections button
  - Show projection state at selected time

**Mock Data**: Sample event stream

---

#### 3.2.8 Copilot / Agent (`/app/copilot`)
**Purpose**: AI assistant interface (see §4 for detailed UI spec)

**Sub-routes**:
- `/app/copilot` - Main copilot interface
- `/app/copilot/history` - Past interactions

**Key Components**: See §4 below

---

### 3.3 Shared Components
- **Header/Navbar**: Logo, navigation menu, user menu, logout
- **As-of Date Selector**: Global component, shows current market date
- **Event Timeline Button**: Quick access to event timeline for current context
- **Status Badges**: Reusable status indicators (blue/green/red)
- **Loading States**: Skeleton loaders, spinners
- **Error Boundaries**: Graceful error handling
- **Scope Breadcrumb**: Shows current context (Household > Account) when drilling down
- **Hierarchy Selector**: Dropdown/selector for navigating hierarchy (Household/Account)

---

## 4. Agent / Copilot UI Specification

### 4.1 Overview
The Copilot interface uses **Liquid Glass** visual effects (based on [kube.io implementation](https://kube.io/blog/liquid-glass-css-svg/)) to create a premium, Apple-like aesthetic. The agent appears as a glass panel that refracts the background content.

### 4.2 Layout

#### 4.2.1 Main Interface (`/app/copilot`)
**Layout**: Split or overlay panel

**Option A - Side Panel** (recommended for desktop):
- Right-side slide-out panel (or persistent sidebar)
- Width: 400-500px
- Liquid glass effect applied to entire panel
- Background content visible through glass (refracted)

**Option B - Overlay Modal**:
- Centered modal/dialog
- Max width: 600px
- Liquid glass effect on modal container
- Backdrop blur

**Option C - Embedded** (for contextual use):
- Inline component within other pages (OMS, PMS)
- Smaller glass panel, context-aware

---

### 4.3 Liquid Glass Implementation

#### 4.3.1 Visual Effect Requirements
Based on the kube.io article, implement:

1. **Refraction Effect**
   - SVG displacement map using `feDisplacementMap`
   - Convex squircle bezel profile (soft transition)
   - Displacement magnitude calculated from surface function
   - Background content visible through glass, bent/refracted

2. **Specular Highlight**
   - Subtle light reflection on glass surface
   - Positioned based on light source (top-left default)
   - Opacity: 0.2-0.5 (configurable)
   - Saturation: 4-9 (configurable)

3. **Glass Material Properties**
   - Refractive index: ~1.5 (glass)
   - Border radius: Rounded corners (squircle preferred)
   - Border: Subtle, light border
   - Background: Semi-transparent white/light overlay

#### 4.3.2 Technical Implementation
- Use SVG filters (`<filter>` with `feDisplacementMap`)
- CSS `backdrop-filter` for blur (Chrome-only, fallback for others)
- Pre-calculate displacement map for performance
- Surface function: Convex Squircle `y = (1 - (1-x)^4)^(1/4)`
- Displacement vector field: Radial from border, magnitude from distance

**Note**: Chrome-only initially (SVG filters as backdrop-filter). Fallback: softer blur effect for Safari/Firefox.

---

### 4.4 Copilot UI Components

#### 4.4.1 Chat Interface
**Structure**:
- **Header**: "Instant Copilot" title, close button
- **Message History**: Scrollable container
  - User messages: Right-aligned, dark teal background
  - Agent messages: Left-aligned, glass effect container
  - Draft proposals: Special glass card with approval UI
- **Input Area**: Text input, send button
- **Status Indicator**: Blue spinner when processing

**Glass Effect Application**:
- Agent message bubbles use liquid glass
- Draft proposal cards use stronger glass effect
- Background (page content) visible through glass, refracted

#### 4.4.2 Draft Proposal Display
When Copilot proposes a command plan:

**Glass Card Container**:
- Liquid glass effect (stronger refraction)
- Rounded corners (squircle)
- Subtle shadow for depth

**Content**:
- **Header**: "Draft Proposal" badge, confidence indicator
- **Commands List**: 
  - Each command as a list item
  - Command type badge
  - Command parameters summary
- **Rationale**: Explanation text
- **Assumptions**: Bullet list
- **Expected Events**: Preview of events that will be emitted
- **Actions**: 
  - "Approve" button (green)
  - "Reject" button (red)
  - "Edit" button (optional)

**Visual Hierarchy**:
- Glass effect draws attention
- Approval buttons prominent (green)
- Rejection subtle (red, secondary)

#### 4.4.3 Contextual Prompts
On OMS/PMS/Compliance pages, show contextual glass panel:

- **Trigger**: Small glass button/floating action button
- **Position**: Bottom-right or inline
- **Content**: Context-aware prompt suggestions
  - "Optimize portfolio for target duration"
  - "Check compliance for this order"
  - "Explain this execution"
- **Interaction**: Click opens full copilot or quick action

#### 4.4.4 Command Bar (Global)
- **Location**: Top of app, below main nav (or floating)
- **Style**: Glass input field with liquid glass effect
- **Placeholder**: "Ask Instant..."
- **Behavior**: 
  - Focus opens copilot panel
  - Type-ahead suggestions
  - Quick actions dropdown

---

### 4.5 Interaction States

#### 4.5.1 Loading State
- Glass panel shows blue spinner (in-progress indicator)
- Subtle pulse animation on glass surface
- Disable input during processing

#### 4.5.2 Error State
- Red border/glow on glass panel
- Error message in glass container
- Retry button

#### 4.5.3 Success State
- Green accent on approved proposals
- Subtle success animation
- Transition to next state

---

### 4.6 Responsive Behavior
- **Desktop**: Side panel or overlay modal
- **Tablet**: Overlay modal, full-width on smaller tablets
- **Mobile**: Full-screen modal, glass effect maintained

---

### 4.7 Mock Data & Progressive Enhancement
**Initial Implementation** (no backend):
- Hardcoded sample responses
- Simulated delay (1-2s) for realism
- Sample draft proposals with command plans
- Mock approval flow (no actual events)

**Backend Integration** (later):
- Replace mock with API calls
- Real-time updates via WebSocket (optional)
- Actual command execution on approval

---

## 5. Implementation Phases

### Phase 1: Home Page & Auth
- [ ] Home page (`/`) with hero, features, login CTA
- [ ] Basic auth flow (mock or real)
- [ ] Protected route wrapper
- [ ] Color system implementation
- [ ] Basic layout components (header, nav)

### Phase 2: Core UI (No Backend)
- [ ] Dashboard (`/app`)
- [ ] OMS pages (blotter, order detail)
- [ ] EMS pages (execution tape, detail)
- [ ] PMS pages (accounts, positions, optimization)
- [ ] Compliance pages (rules, violations)
- [ ] Market Data pages (grid, curves)
- [ ] Event Studio (timeline, replay)
- [ ] Mock data for all views
- [ ] Status indicators, loading states

### Phase 3: Agent UI with Liquid Glass
- [ ] Liquid glass effect implementation (SVG filters)
- [ ] Copilot main interface (`/app/copilot`)
- [ ] Chat interface with glass message bubbles
- [ ] Draft proposal glass cards
- [ ] Contextual prompts
- [ ] Global command bar
- [ ] Mock agent responses

### Phase 4: Backend Integration
- [ ] API client setup
- [ ] Replace mock data with API calls
- [ ] Real-time updates (if applicable)
- [ ] Error handling, retry logic
- [ ] Authentication integration

---

## 6. Technical Stack Recommendations

### 6.1 Framework
- **Next.js** (already in use) - App Router
- **React** - Component library
- **TypeScript** - Type safety

### 6.2 Styling
- **Tailwind CSS** (already in use)
- **CSS Custom Properties** - For color system
- **SVG Filters** - For liquid glass effect

### 6.3 State Management
- **Zustand** or **React Context** - For auth, global state
- **React Query** (TanStack Query) - For server state (when backend exists)

### 6.4 UI Components
- **shadcn/ui** (already in use) - Base components
- Custom glass components built on top

### 6.5 Data Visualization
- **Recharts** or **Chart.js** - For yield curves, analytics charts
- Custom SVG for liquid glass effects

---

## 7. Design Principles

### 7.1 Visual Hierarchy
- Liquid glass draws attention to important elements (agent, proposals)
- Status colors (blue/green/red) provide immediate feedback
- Dark teal (`#1d2b2d`) for primary content, white for backgrounds

### 7.2 Explainability
- Every screen shows as-of date
- Compliance decisions show rule + metrics + explanation
- Executions show slippage decomposition
- Events show full context

### 7.3 Performance
- Liquid glass effects can be expensive; optimize displacement map calculations
- Lazy load heavy components
- Virtualize long lists (orders, events)

### 7.4 Accessibility
- Maintain WCAG AA contrast ratios
- Keyboard navigation for all interactions
- Screen reader support for glass effects (provide text alternatives)
- Focus indicators visible

---

## 8. Mock Data Structure

### 8.1 Sample Data Files
Create JSON files in `/client/data/mock/`:
- `households.json` - Sample households
- `accounts.json` - Sample accounts linked to households
- `orders.json` - Sample orders in various states (with account/household context)
- `executions.json` - Sample executions with fills
- `proposals.json` - Sample optimization proposals
- `rules.json` - Sample compliance rules at each scope level (global, household, account)
- `instruments.json` - Sample UST instruments
- `events.json` - Sample event stream
- `copilot-responses.json` - Sample agent responses

### 8.2 Data Shape
Match the domain model from technical spec:
- Orders with states, compliance flags
- Executions with slippage decomposition
- Accounts with positions and analytics
- Proposals with command plans
- Events with full envelope structure

---

## 9. Notes & Considerations

### 9.1 Liquid Glass Performance
- Pre-calculate displacement maps where possible
- Cache SVG filter definitions
- Consider reducing effect intensity on lower-end devices
- Provide toggle to disable effect if needed

### 9.2 Browser Compatibility
- Chrome: Full liquid glass effect
- Safari/Firefox: Fallback to softer blur (no refraction)
- Graceful degradation

### 9.3 Progressive Enhancement
- Core functionality works without glass effects
- Glass effects are visual enhancement
- Ensure usability without effects

### 9.4 Future Enhancements
- Animation when glass panels appear/disappear
- Interactive glass surface (drag to adjust)
- Multiple glass panels with different refraction levels
- Dynamic light source based on cursor position

---

## 10. References

- [Liquid Glass CSS/SVG Implementation](https://kube.io/blog/liquid-glass-css-svg/)
- Technical Spec: `/docs/instant-technical-spec.md`
- Snell's Law for refraction calculations
- SVG Filter Effects specification

