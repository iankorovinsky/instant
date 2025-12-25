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
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

const benefits = [
  "Real-time portfolio analytics",
  "Automated compliance checks",
  "Complete audit trail",
  "AI-powered insights",
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Instant</span>
          </Link>
          <Suspense fallback={<Skeleton className="h-9 w-24" />}>
            <AuthButton />
          </Suspense>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container relative py-24 md:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6">
                Built for Financial Advisors
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Portfolio Management,{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
                Instant is an intelligent portfolio management system. Manage
                households, optimize portfolios, and ensure compliance with
                event-sourced architecture and AI-powered insights.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/auth/sign-up">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t bg-muted/30 py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A complete platform for modern portfolio management with
                event-sourced architecture.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="group relative overflow-hidden border-border/50 bg-card transition-all hover:border-primary/20 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary py-24 text-primary-foreground">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Transform Your Practice?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Join advisors who are using Instant to streamline their
                portfolio management and deliver better outcomes for clients.
              </p>
              <div className="mt-10">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2"
                  asChild
                >
                  <Link href="/auth/sign-up">
                    Create Your Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Instant</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for financial advisors who demand more from their tools.
          </p>
        </div>
      </footer>
    </div>
  );
}
