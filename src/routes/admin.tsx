import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Users, Store, LogOut } from "lucide-react";

const ADMIN_EMAIL = "vini@admin.com";

const NAV = [
  { to: "/admin/membros" as const, icon: Users, label: "Membros" },
  { to: "/admin/parceiros" as const, icon: Store, label: "Parceiros" },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/clube/login" });
    if (session.user.email !== ADMIN_EMAIL) throw redirect({ to: "/clube/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { location } = useRouterState();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/clube/login";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: "var(--glass)",
          borderColor: "rgba(75,0,129,0.25)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          className="flex items-center justify-between px-4"
          style={{
            paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
            paddingBottom: "0.75rem",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#4B0081" }}>
              <Store className="h-4 w-4 text-white" />
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
        </div>

        {/* Nav tabs */}
        <div className="flex border-t" style={{ borderColor: "var(--hairline)" }}>
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-muted)",
                  borderBottomColor: active ? "#4B0081" : "transparent",
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="p-4 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
