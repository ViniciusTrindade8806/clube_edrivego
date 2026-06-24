import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { TierBadge } from "@/components/clube/TierBadge";
import type { Tier } from "@/lib/clube";
import { getTheme, toggleTheme, type Theme } from "@/lib/theme";
import { LayoutDashboard, Gift, User, Sun, Moon, Trophy } from "lucide-react";

interface ClubeShellProps {
  children: ReactNode;
  tier?: Tier;
}

const NAV = [
  { to: "/clube/dashboard" as const, icon: LayoutDashboard, label: "Início" },
  { to: "/clube/beneficios" as const, icon: Gift, label: "Benefícios" },
  { to: "/clube/ranking" as const, icon: Trophy, label: "Ranking" },
  { to: "/clube/perfil" as const, icon: User, label: "Perfil" },
];

export function ClubeShell({ children, tier }: ClubeShellProps) {
  const { location } = useRouterState();
  const [tema, setTema] = useState<Theme>(getTheme);

  function handleToggleTema() {
    const next = toggleTheme();
    setTema(next);
  }

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
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center"
            style={{ background: "#4B0081" }}>
            <svg width="16" height="16" viewBox="0 0 255 255" fill="none" aria-hidden>
              <path d="M78.3091 137.645L84.242 125.053C84.6306 124.229 85.2212 123.623 86.2208 123.624L118.292 123.679C119.345 123.68 120.109 125.182 120.109 126.08L120.113 138.657C120.113 142.434 119.147 145.963 117.569 149.375C110.044 165.659 90.9657 172.435 73.9613 169.687C64.9805 168.236 56.8448 163.807 50.6235 157.231C46.4555 152.824 43.4076 147.687 41.4136 142.058C34.9953 123.945 41.2337 103.676 56.8432 92.4529C64.0828 87.2464 72.9125 84.6686 81.9035 84.7195C93.9695 84.7891 105.06 89.9583 112.9 99.012C113.061 99.1987 113.243 99.3362 113.246 99.5602C113.25 99.7978 113.126 100.023 112.864 100.219L101.279 108.779C100.578 109.296 99.972 109.22 99.4035 108.643C91.429 100.544 79.1017 98.766 69.1264 104.164C60.1965 108.997 54.9085 118.47 55.2937 128.653C55.7044 139.521 62.5554 149.189 72.8803 152.809C84.8428 157.004 99.473 152.096 104.467 139.538L79.7211 139.512C78.8013 139.512 77.8509 138.618 78.3091 137.644V137.645Z" fill="white"/>
              <path d="M179.08 84.7188C199.516 84.7188 216.084 101.286 216.084 121.723V133.278C216.083 153.715 199.516 170.282 179.08 170.282H166.758C146.322 170.282 129.755 153.715 129.755 133.278V121.723C129.755 101.286 146.322 84.7188 166.758 84.7188H179.08ZM157.08 104.625C155.476 103.753 153.647 105.329 154.27 107.044L160.209 123.384C161.138 125.941 161.212 128.731 160.419 131.334L155.302 148.115C154.78 149.829 156.619 151.302 158.177 150.417L195.732 129.086C197.084 128.318 197.066 126.363 195.7 125.62L157.08 104.625Z" fill="white"/>
            </svg>
          </div>
          <span className="font-display font-bold text-sm" style={{ color: "var(--ink)" }}>
            Clube de Benefícios
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTema}
            aria-label={tema === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            className="grid h-8 w-8 place-items-center rounded-full transition-colors"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            {tema === "dark"
              ? <Sun className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />
              : <Moon className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />}
          </button>
          {tier && <TierBadge tier={tier} size="sm" glow />}
        </div>
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
