import { AuthButton } from "@/components/auth/auth-button";
import Link from "next/link";
import { Suspense } from "react";
import {
  Building2,
  TrendingUp,
  Shield,
  History,
  Zap,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Building2,
    title: "Household & Account Management",
    description:
      "Organize clients by household with full account hierarchy. Aggregate positions and analytics across accounts.",
  },
  {
    icon: TrendingUp,
    title: "Portfolio Optimization",
    description:
      "AI-powered optimization for duration targeting, bucket weights, and rebalancing proposals.",
  },
  {
    icon: Shield,
    title: "Compliance Rules Engine",
    description:
      "Define rules at global, household, or account level. Automatic enforcement with clear explanations.",
  },
  {
    icon: History,
    title: "Event-Sourced Audit Trail",
    description:
      "Complete traceability with event timeline. Replay and time-travel debugging for full transparency.",
  },
  {
    icon: Zap,
    title: "Order Management",
    description:
      "Full order lifecycle from draft to execution. Real-time status tracking with compliance checks.",
  },
  {
    icon: LineChart,
    title: "Execution Analysis",
    description:
      "Detailed slippage decomposition and fill analysis. Understand every execution decision.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Instant</span>
          </Link>
          <Suspense fallback={<div className="h-9 w-24 bg-muted animate-pulse rounded-md" />}>
            <AuthButton />
          </Suspense>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-background to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Portfolio Management,{" "}
            <span className="text-secondary">Reimagined</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Instant is an intelligent portfolio management system for financial
            advisors. Manage households, optimize portfolios, and ensure
            compliance with a powerful AI copilot at your side.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/login">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform for modern portfolio management with
              event-sourced architecture and AI-powered insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join advisors who are using Instant to streamline their portfolio
            management and deliver better outcomes for clients.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-lg px-8"
          >
            <Link href="/auth/sign-up">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Instant</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for financial advisors who demand more from their tools.
          </p>
        </div>
      </footer>
    </main>
  );
}
