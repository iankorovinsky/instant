"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <Button
      onClick={logout}
      variant="ghost"
      className="w-full justify-start gap-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </Button>
  );
}
