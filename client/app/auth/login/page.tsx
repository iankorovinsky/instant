import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function Page() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="relative hidden bg-primary lg:flex lg:flex-col lg:justify-between p-10">
        <Link href="/" className="flex items-center gap-2.5 text-primary-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Instant</span>
        </Link>
        <div className="space-y-4">
          <blockquote className="space-y-2">
            <p className="text-lg text-primary-foreground/90">
              &ldquo;Instant has transformed how we manage our client portfolios.
              The compliance automation alone has saved us countless hours.&rdquo;
            </p>
            <footer className="text-sm text-primary-foreground/70">
              — Sarah Chen, Senior Financial Advisor
            </footer>
          </blockquote>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Portfolio Management, Reimagined
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Instant</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
