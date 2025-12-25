import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/");
  }

  const userEmail = data.claims.email as string;

  return (
    <SidebarProvider>
      <AppSidebar userEmail={userEmail} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function LayoutSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="w-64 shrink-0 bg-sidebar p-4 space-y-4">
        <Skeleton className="h-12 w-full bg-white/10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full bg-white/10" />
          <Skeleton className="h-8 w-full bg-white/10" />
          <Skeleton className="h-8 w-full bg-white/10" />
          <Skeleton className="h-8 w-full bg-white/10" />
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
