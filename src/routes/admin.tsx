import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Users, LogOut } from "lucide-react";

const ADMIN_EMAIL = "vini@admin.com";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/clube/login" });
    if (session.user.email !== ADMIN_EMAIL) throw redirect({ to: "/clube/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/clube/login";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 border-b"
        style={{
          backgroundColor: "var(--glass)",
          borderColor: "rgba(75,0,129,0.30)",
          backdropFilter: "blur(16px)",
          paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
          paddingBottom: "0.75rem",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "#4B0081" }}>
            <Users className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold" style={{ color: "var(--ink)" }}>
            Admin · e-Drive Go
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: "var(--ink-muted)" }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </header>
      <main className="p-4 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
