import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { TierBadge } from "@/components/clube/TierBadge";
import type { Tier } from "@/lib/clube";
import { LayoutDashboard, Gift, User } from "lucide-react";

interface ClubeShellProps {
  children: ReactNode;
  tier?: Tier;
}

const NAV = [
  { to: "/clube/dashboard" as const, icon: LayoutDashboard, label: "Início" },
  { to: "/clube/beneficios" as const, icon: Gift, label: "Benefícios" },
  { to: "/clube/perfil" as const, icon: User, label: "Perfil" },
];

export function ClubeShell({ children, tier }: ClubeShellProps) {
  const { location } = useRouterState();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 border-b"
        style={{
          backgroundColor: "var(--glass)",
          borderColor: "var(--hairline)",
          backdropFilter: "blur(16px)",
          paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
          paddingBottom: "0.75rem",
        }}
      >
        <Link to="/" aria-label="e-Drive Go home">
          <Logo />
        </Link>
        {tier && <TierBadge tier={tier} size="sm" />}
      </header>

      <main
        className="flex-1 overflow-auto"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t"
        style={{
          backgroundColor: "var(--glass)",
          borderColor: "var(--hairline)",
          backdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? "var(--gain)" : "var(--ink-muted)" }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
