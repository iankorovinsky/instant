# Instant Architecture Diagrams

## 1. High-Level Systems Design

```mermaid
flowchart TD
    User[User Browser]
    Frontend[Next.js Frontend<br/>:3000]
    GoAPI[Go API Server<br/>:8080]
    Copilot[Python Copilot Service<br/>:8000]
    Temporal[Temporal Server<br/>:7233]
  
    subgraph Database[PostgreSQL Supabase]
        EventStore[(Event Store<br/>Immutable Log)]
        ReadModels[(Read Models<br/>Orders, Executions,<br/>Holdings, etc.)]
    end
  
    subgraph EventBus[In-Process Event Bus]
        Bus[Event Bus<br/>Pub/Sub]
    end
  
    subgraph Projections[Projection Workers]
        OMSProj[OMS Projection]
        EMSProj[EMS Projection]
        PMSProj[PMS Projection]
        CompProj[Compliance Projection]
    end
  
    User -->|HTTP| Frontend
    Frontend -->|REST API| GoAPI
    Frontend -->|REST API| Copilot
    GoAPI -->|Commands| EventStore
    EventStore -->|Publish| Bus
    Bus -->|Subscribe| OMSProj
    Bus -->|Subscribe| EMSProj
    Bus -->|Subscribe| PMSProj
    Bus -->|Subscribe| CompProj
    OMSProj -->|Write| ReadModels
    EMSProj -->|Write| ReadModels
    PMSProj -->|Write| ReadModels
    CompProj -->|Write| ReadModels
    GoAPI -->|Query| ReadModels
    Frontend -->|Query Views| GoAPI
    GoAPI -->|Workflows| Temporal
    Copilot -->|LLM| Cohere[Cohere API]
```

## 2. User Flow

```mermaid

```

## 3. Backend Diagram

```mermaid
flowchart LR
    subgraph HTTP[HTTP Layer]
        Routes[Gin Router]
        OMSHandler[OMS Handlers]
        EMSHandler[EMS Handlers]
        PMSHandler[PMS Handlers]
        CompHandler[Compliance Handlers]
        MDHandler[Market Data Handlers]
        CopilotHandler[Copilot Handlers]
    end
  
    subgraph Services[Domain Services]
        OMSSvc[OMS Service]
        EMSSvc[EMS Service]
        PMSSvc[PMS Service]
        CompSvc[Compliance Service]
        PricingSvc[Pricing Service]
    end
  
    subgraph EventLayer[Event Layer]
        EventStore[Event Store]
        EventBus[Event Bus]
    end
  
    subgraph Projections[Projection Workers]
        OMSProj[OMS Projection]
        EMSProj[EMS Projection]
        PMSProj[PMS Projection]
        CompProj[Compliance Projection]
    end
  
    subgraph Database[Database]
        EventsTable[(events table)]
        OrdersTable[(orders table)]
        ExecutionsTable[(executions table)]
        HoldingsTable[(holdings table)]
        RulesTable[(rules table)]
    end
  
    Routes --> OMSHandler
    Routes --> EMSHandler
    Routes --> PMSHandler
    Routes --> CompHandler
    Routes --> MDHandler
    Routes --> CopilotHandler
  
    OMSHandler --> OMSSvc
    EMSHandler --> EMSSvc
    PMSHandler --> PMSSvc
    CompHandler --> CompSvc
  
    OMSSvc --> EventStore
    EMSSvc --> EventStore
    PMSSvc --> EventStore
    CompSvc --> EventStore
  
    EventStore --> EventsTable
    EventStore --> EventBus
  
    EventBus --> OMSProj
    EventBus --> EMSProj
    EventBus --> PMSProj
    EventBus --> CompProj
  
    OMSProj --> OrdersTable
    EMSProj --> ExecutionsTable
    PMSProj --> HoldingsTable
    CompProj --> RulesTable
  
    OMSHandler -.->|Query| OrdersTable
    EMSHandler -.->|Query| ExecutionsTable
    PMSHandler -.->|Query| HoldingsTable
    CompHandler -.->|Query| RulesTable
    MDHandler -.->|Query| InstrumentsTable[(instruments table)]
  
    EMSSvc --> PricingSvc
    PMSSvc --> PricingSvc
```

## 4. Frontend Diagram

```mermaid
flowchart TD
    subgraph Pages[App Router Pages]
        OMSPage["app/oms"]
        EMSPage["app/ems"]
        PMSPage["app/pms"]
        CompPage["app/compliance"]
        MDPage["app/marketdata"]
        CopilotPage["app/copilot"]
    end
  
    subgraph Components[UI Components]
        UIComponents["shadcn/ui Components"]
        DomainComponents["Domain Components<br/>Blotter, OrderForm, etc."]
    end
  
    subgraph DataLayer[Data Layer]
        API["API Clients<br/>lib/api"]
        Hooks["React Query Hooks<br/>lib/hooks"]
        Types["Type Definitions<br/>lib types.ts"]
    end
  
    subgraph BackendAPI[Backend API]
        Commands["api/oms<br/>api/ems<br/>api/pms"]
        Views["api/views"]
        CopilotAPI["api/copilot"]
    end
  
    Pages --> Components
    Pages --> Hooks
    Components --> UIComponents
    Components --> DomainComponents
    Hooks --> API
    API --> Types
    API --> Commands
    API --> Views
    API --> CopilotAPI
    CopilotPage --> CopilotAPI
```

## 5. Agent Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant CopilotUI as Copilot UI
    participant GoAPI as Go API<br/>:8080
    participant PythonAgent as Python Agent<br/>:8000
    participant LLM as Cohere LLM
    participant EventStore
  
    User->>CopilotUI: Natural Language Query
    CopilotUI->>PythonAgent: POST /copilot/propose<br/>{query, context, userId}
    PythonAgent->>LLM: Generate Command Plan
    LLM-->>PythonAgent: JSON Command Plan
    PythonAgent-->>CopilotUI: CommandPlan<br/>{commands, rationale, confidence}
    CopilotUI-->>User: Display Proposal
  
    alt User Approves
        User->>CopilotUI: Approve Plan
        CopilotUI->>GoAPI: POST /api/copilot/drafts/:id/approve
        GoAPI->>EventStore: Append(AIDraftApproved)
        CopilotUI->>GoAPI: Execute Commands<br/>POST /api/oms/orders, etc.
        GoAPI->>EventStore: Append(OrderCreated, etc.)
        GoAPI-->>CopilotUI: Success
        CopilotUI-->>User: Commands Executed
    else User Rejects
        User->>CopilotUI: Reject Plan
        CopilotUI->>GoAPI: POST /api/copilot/drafts/:id/reject
        GoAPI->>EventStore: Append(AIDraftRejected)
        GoAPI-->>CopilotUI: Draft Rejected
        CopilotUI-->>User: Plan Rejected
    end
  
    Note over PythonAgent,LLM: Agent is propose-only<br/>Never emits events directly
```
