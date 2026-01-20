"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const sections = [
  {
    id: "architecture",
    label: "Architecture",
  },
  {
    id: "systems-design",
    label: "Systems Design",
  },
  {
    id: "backend-design",
    label: "Backend Design",
  },
  {
    id: "frontend-design",
    label: "Frontend Design",
  },
  {
    id: "agent-design",
    label: "Agent Design",
  },
  {
    id: "implementation-details",
    label: "Implementation Details",
    children: [
      { id: "temporal-workflows", label: "Temporal Workflows" },
      { id: "projection-workers", label: "Projection Workers" },
      { id: "event-bus", label: "Event Bus" },
      { id: "product-flow", label: "Product" },
      { id: "agent-impl", label: "Agent" },
    ],
  },
  {
    id: "ui-ux-design",
    label: "UI/UX Design",
    children: [
      { id: "ui-dashboard", label: "Dashboard" },
      { id: "ui-orders", label: "Orders" },
      { id: "ui-portfolios", label: "Portfolios" },
      { id: "ui-executions", label: "Executions" },
      { id: "ui-market-data", label: "Market Data" },
      { id: "ui-compliance", label: "Compliance" },
      { id: "ui-agent", label: "Agent" },
    ],
  },
  {
    id: "dev-experience",
    label: "Dev Experience",
    children: [
      { id: "makefiles", label: "Makefiles" },
      { id: "tui", label: "Development TUI" },
    ],
  },
];

export default function CaseStudyPage() {
  const [activeSection, setActiveSection] = useState("architecture");
  const sectionIds = useMemo(() => {
    const ids: string[] = [];
    sections.forEach((section) => {
      ids.push(section.id);
      section.children?.forEach((child) => ids.push(child.id));
    });
    return ids;
  }, []);

  useEffect(() => {
    const targets = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!targets.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [sectionIds]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12">
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="text-sm font-semibold text-[#252d2e] mb-4">
            Instant
          </div>
          <nav className="space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <a
                  href={`#${section.id}`}
                  className={`block text-sm transition-colors ${
                    activeSection === section.id
                      ? "text-[#252d2e] font-medium"
                      : "text-[#7c7c7c] hover:text-[#252d2e]"
                  }`}
                >
                  {section.label}
                </a>
                {section.children && (
                  <div className="space-y-2 pl-4 border-l border-gray-200">
                    {section.children.map((child) => (
                      <a
                        key={child.id}
                        href={`#${child.id}`}
                        className={`block text-sm transition-colors ${
                          activeSection === child.id
                            ? "text-[#252d2e] font-medium"
                            : "text-[#7c7c7c] hover:text-[#252d2e]"
                        }`}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="space-y-16 max-w-4xl">
          <header className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold text-[#252d2e]">
              Instant
            </h1>
            <p className="text-[#7c7c7c] leading-relaxed">
              Instant is an event-sourced trading system for US Treasuries that
              combines OMS, EMS, PMS, compliance, and market data with an AI
              copilot that proposes actions but never bypasses user approval.
            </p>
            <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
              <Image
                src="/case-study/cover.png"
                alt="Case study cover"
                width={5088}
                height={3378}
                className="w-full h-auto"
                sizes="(min-width: 1024px) 640px, 100vw"
                priority
              />
            </div>
          </header>

          <section id="architecture" className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#252d2e]">
              Architecture
            </h2>
            <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
              <Image
                src="/case-study/user-flow.png"
                alt="User flow"
                width={8192}
                height={4381}
                className="w-full h-auto"
                sizes="(min-width: 1024px) 640px, 100vw"
              />
            </div>
          </section>

          <section id="systems-design" className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#252d2e]">
              Systems Design
            </h2>
            <p className="text-[#7c7c7c] leading-relaxed">
              The system is split into a Go API{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                services/api
              </code>
              , Temporal workflows and activities{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                services/temporal
              </code>
              , a FastAPI copilot service{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                agent
              </code>
              , and a Next.js frontend{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                client
              </code>
              . The Go API acts as the command gateway while Temporal handles
              durable workflows like ingestion and long-running domain
              processes.
            </p>
            <p className="text-[#7c7c7c] leading-relaxed">
              Every state transition is recorded as an immutable event in
              PostgreSQL. Projection workers subscribe to the event bus and
              materialize read models for OMS, EMS, PMS, compliance, and market
              data so the UI can query fast, stable views without touching the
              aggregates directly.
            </p>
            <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
              <Image
                src="/case-study/systems-design.png"
                alt="Systems design"
                width={7733}
                height={5565}
                className="w-full h-auto"
                sizes="(min-width: 1024px) 640px, 100vw"
              />
            </div>
          </section>

          <section id="backend-design" className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#252d2e]">
              Backend Design
            </h2>
            <p className="text-[#7c7c7c] leading-relaxed">
              The Go backend encapsulates OMS and EMS lifecycles, compliance
              checks, portfolio rebalancing, and market data evaluation. Each
              command emits typed events and includes correlation/causation IDs
              so downstream projections can stitch together workflows.
            </p>
            <p className="text-[#7c7c7c] leading-relaxed">
              Temporal workflows orchestrate batch operations (like market data
              ingestion) and execution simulations. These workflows emit their
              own events, making execution output traceable alongside order and
              portfolio updates.
            </p>
            <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
              <Image
                src="/case-study/backend.png"
                alt="Backend design"
                width={8192}
                height={7365}
                className="w-full h-auto"
                sizes="(min-width: 1024px) 640px, 100vw"
              />
            </div>
          </section>

          <section id="frontend-design" className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#252d2e]">
              Frontend Design
            </h2>
            <p className="text-[#7c7c7c] leading-relaxed">
              The frontend is a Next.js 15 app in{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                client/
              </code>{" "}
              with route-based screens under{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                client/app
              </code>
              .
              It uses shadcn/ui primitives from{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                client/components/ui
              </code>{" "}
              and data helpers in{" "}
              <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                client/lib
              </code>
              , with pages built around the read models emitted by backend
              projections.
            </p>
            <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
              <Image
                src="/case-study/frontend.png"
                alt="Frontend design"
                width={5991}
                height={2900}
                className="w-full h-auto"
                sizes="(min-width: 1024px) 640px, 100vw"
              />
            </div>
          </section>

          <section id="agent-design" className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#252d2e]">
              Agent Design
            </h2>
            <p className="text-[#7c7c7c] leading-relaxed">
              The copilot runs as a FastAPI service. It translates natural
              language into structured command proposals that the UI surfaces
              for explicit approval. Approved proposals become commands that
              emit events, keeping the event log as the sole source of truth.
            </p>
            <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
              <Image
                src="/case-study/agent.png"
                alt="Agent design"
                width={8192}
                height={6286}
                className="w-full h-auto"
                sizes="(min-width: 1024px) 640px, 100vw"
              />
            </div>
          </section>

          <section id="implementation-details" className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#252d2e]">
                Implementation Details
              </h2>
            </div>

            <div id="temporal-workflows" className="space-y-3">
              <h3 className="text-xl font-semibold text-[#252d2e]">
                Temporal Workflows
              </h3>
              <p className="text-[#7c7c7c] leading-relaxed">
                Temporal runs in{" "}
                <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                  services/temporal
                </code>{" "}
                with workflows and
                activities registered in the worker. The default workflow
                demonstrates retry policies and activity orchestration, which
                the system uses as the template for durable ingestion and
                simulation jobs that should survive restarts.
              </p>
            </div>

            <div id="projection-workers" className="space-y-3">
              <h3 className="text-xl font-semibold text-[#252d2e]">
                Projection Workers
              </h3>
              <p className="text-[#7c7c7c] leading-relaxed">
                OMS, EMS, PMS, and compliance projections subscribe to the
                event bus and materialize read models in Postgres. Each
                projection worker runs in-process (started in{" "}
                <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                  services/api
                </code>
                )
                and updates domain-specific tables as events stream in.
              </p>
            </div>

            <div id="event-bus" className="space-y-3">
              <h3 className="text-xl font-semibold text-[#252d2e]">
                Event Bus
              </h3>
              <p className="text-[#7c7c7c] leading-relaxed">
                The event bus is an in-process fan-out with per-event-type
                subscriptions and non-blocking sends. This keeps the write path
                fast while allowing projection workers and compliance services
                to react without coupling to the command handlers.
              </p>
            </div>

            <div id="product-flow" className="space-y-3">
              <h3 className="text-xl font-semibold text-[#252d2e]">
                Product
              </h3>
              <p className="text-[#7c7c7c] leading-relaxed">
                From the code paths, a likely flow is: OMS creates orders,
                compliance evaluates pre-trade rules, and approved orders are
                sent to EMS for deterministic execution simulation. PMS and
                compliance projections then reflect holdings, execution results,
                and audit traces across the UI.
              </p>
            </div>

            <div id="agent-impl" className="space-y-3">
              <h3 className="text-xl font-semibold text-[#252d2e]">
                Agent
              </h3>
              <p className="text-[#7c7c7c] leading-relaxed">
                The copilot service emits proposal events like{" "}
                <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                  AIDraftProposed
                </code>
                , then waits for explicit approval to record{" "}
                <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                  AIDraftApproved
                </code>{" "}
                or{" "}
                <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                  AIDraftRejected
                </code>
                . This keeps AI actions
                fully auditable in the same event stream as human actions.
              </p>
            </div>
          </section>

          <section id="ui-ux-design" className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#252d2e]">
              UI/UX Design
            </h2>
            <div className="space-y-10">
              <div id="ui-dashboard" className="space-y-3">
                <h3 className="text-xl font-semibold text-[#252d2e]">
                  Dashboard
                </h3>
                <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
                  <Image
                    src="/case-study/dashboard/dashboard-1.png"
                    alt="Dashboard"
                    width={5088}
                    height={3378}
                    className="w-full h-auto"
                    sizes="(min-width: 1024px) 640px, 100vw"
                  />
                </div>
              </div>

              <div id="ui-orders" className="space-y-3">
                <h3 className="text-xl font-semibold text-[#252d2e]">
                  Orders
                </h3>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
                    <Image
                      src="/case-study/orders/orders-1.png"
                      alt="Orders view"
                      width={5088}
                      height={3378}
                      className="w-full h-auto"
                      sizes="(min-width: 1024px) 640px, 100vw"
                    />
                  </div>
                  <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
                    <Image
                      src="/case-study/orders/orders-2.png"
                      alt="Orders detail"
                      width={5088}
                      height={3378}
                      className="w-full h-auto"
                      sizes="(min-width: 1024px) 640px, 100vw"
                    />
                  </div>
                </div>
              </div>

              <div id="ui-portfolios" className="space-y-3">
                <h3 className="text-xl font-semibold text-[#252d2e]">
                  Portfolios
                </h3>
                <div className="space-y-4">
                  {[
                    "portfolios-1.png",
                    "portfolios-2.png",
                    "portfolios-3.png",
                    "portfolios-4.png",
                    "portfolios-5.png",
                  ].map((image) => (
                    <div
                      key={image}
                      className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden"
                    >
                      <Image
                        src={`/case-study/portfolios/${image}`}
                        alt={`Portfolios ${image}`}
                        width={5088}
                        height={3378}
                        className="w-full h-auto"
                        sizes="(min-width: 1024px) 640px, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div id="ui-executions" className="space-y-3">
                <h3 className="text-xl font-semibold text-[#252d2e]">
                  Executions
                </h3>
                <div className="space-y-4">
                  {["executions-1.png", "executions-2.png"].map((image) => (
                    <div
                      key={image}
                      className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden"
                    >
                      <Image
                        src={`/case-study/executions/${image}`}
                        alt={`Executions ${image}`}
                        width={5088}
                        height={3378}
                        className="w-full h-auto"
                        sizes="(min-width: 1024px) 640px, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div id="ui-market-data" className="space-y-3">
                <h3 className="text-xl font-semibold text-[#252d2e]">
                  Market Data
                </h3>
                <div className="space-y-4">
                  {[
                    "market-data-1.png",
                    "market-data-2.png",
                    "market-data-3.png",
                  ].map((image) => (
                    <div
                      key={image}
                      className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden"
                    >
                      <Image
                        src={`/case-study/market-data/${image}`}
                        alt={`Market data ${image}`}
                        width={5088}
                        height={3378}
                        className="w-full h-auto"
                        sizes="(min-width: 1024px) 640px, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div id="ui-compliance" className="space-y-3">
                <h3 className="text-xl font-semibold text-[#252d2e]">
                  Compliance
                </h3>
                <div className="space-y-4">
                  {[
                    "compliance-1.png",
                    "compliance-2.png",
                    "compliance-3.png",
                  ].map((image) => (
                    <div
                      key={image}
                      className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden"
                    >
                      <Image
                        src={`/case-study/compliance/${image}`}
                        alt={`Compliance ${image}`}
                        width={5088}
                        height={3378}
                        className="w-full h-auto"
                        sizes="(min-width: 1024px) 640px, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div id="ui-agent" className="space-y-3">
                <h3 className="text-xl font-semibold text-[#252d2e]">
                  Agent
                </h3>
                <div className="space-y-4">
                  {["agent-1.png", "agent-2.png"].map((image) => (
                    <div
                      key={image}
                      className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden"
                    >
                      <Image
                        src={`/case-study/agent/${image}`}
                        alt={`Agent ${image}`}
                        width={5088}
                        height={3378}
                        className="w-full h-auto"
                        sizes="(min-width: 1024px) 640px, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="dev-experience" className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#252d2e]">
                Dev Experience
              </h2>
            </div>

            <div id="makefiles" className="space-y-3">
              <h3 className="text-xl font-semibold text-[#252d2e]">
                Makefiles
              </h3>
              <p className="text-[#7c7c7c] leading-relaxed">
                Setup uses Make targets, so that the developer can manage their environment with ease.
              </p>
              <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
                <Image
                  src="/case-study/makefile.png"
                  alt="Makefile workflows"
                  width={2350}
                  height={972}
                  className="w-full h-auto"
                  sizes="(min-width: 1024px) 640px, 100vw"
                />
              </div>
            </div>

            <div id="tui" className="space-y-3">
              <h3 className="text-xl font-semibold text-[#252d2e]">
                Development TUI
              </h3>
              <p className="text-[#7c7c7c] leading-relaxed">
                The infra TUI{" "}
                <code className="text-[#252d2e] bg-[#f2f3f5] border border-[#e2e5e8] rounded px-1.5 py-0.5 text-sm font-mono">
                  make dev
                </code>{" "}
                provides a fast control plane for starting services, checking
                workflow status, and iterating without leaving the terminal.
              </p>
              <div className="rounded-2xl bg-[#f7f7f7] border border-[#e2e5e8] overflow-hidden">
                <Image
                  src="/case-study/tui.png"
                  alt="Development TUI"
                  width={2178}
                  height={724}
                  className="w-full h-auto"
                  sizes="(min-width: 1024px) 640px, 100vw"
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
