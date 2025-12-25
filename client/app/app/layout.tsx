import Link from "next/link";
import { Suspense } from "react";
import {
  Zap,
  LayoutDashboard,
  FileText,
  TrendingUp,
  Briefcase,
  Shield,
  LineChart,
  History,
  Bot,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";

const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/oms", label: "Orders", icon: FileText },
  { href: "/app/ems", label: "Executions", icon: TrendingUp },
  { href: "/app/pms", label: "Portfolios", icon: Briefcase },
  { href: "/app/compliance", label: "Compliance", icon: Shield },
  { href: "/app/marketdata", label: "Market Data", icon: LineChart },
  { href: "/app/events", label: "Events", icon: History },
  { href: "/app/copilot", label: "Copilot", icon: Bot },
];

async function UserSection() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/");
  }

  const userEmail = data.claims.email as string;

  return (
    <div className="p-4 border-t border-primary-foreground/10">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-sm font-medium text-secondary-foreground">
            {userEmail?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{userEmail}</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}

function UserSectionSkeleton() {
  return (
    <div className="p-4 border-t border-primary-foreground/10">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary-foreground/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-primary-foreground/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-9 w-full bg-primary-foreground/10 rounded animate-pulse" />
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-primary-foreground/10">
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold">Instant</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <Suspense fallback={<UserSectionSkeleton />}>
          <UserSection />
        </Suspense>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
