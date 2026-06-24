import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClubeShell } from "@/components/clube/ClubeShell";
import { TierBadge } from "@/components/clube/TierBadge";
import {
  type Membro,
  getOrCreateMembro,
  tierProgress,
  TIER_CONFIG,
  TIER_ORDER,
} from "@/lib/clube";
import { supabase } from "@/lib/supabase";
import { Copy, Check, LogOut, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/clube/perfil")({
  component: ProtectedPerfil,
});

function ProtectedPerfil() {
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getOrCreateMembro().then((m) => {
      if (!m) navigate({ to: "/clube/login" });
      else {
        setMembro(m);
        setLoading(false);
      }
    });
  }, [navigate]);

  if (loading) return <FullLoader />;
  return <Perfil membro={membro!} />;
}

function Perfil({ membro }: { membro: Membro }) {
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const { tier, progress, mesesParaProximo } = tierProgress(membro.meses_contrato);
  const cfg = TIER_CONFIG[tier];
  const nextTier = cfg.next;
  const nextCfg = nextTier ? TIER_CONFIG[nextTier] : null;
  const firstName = membro.nome.split(" ")[0];

  const indicacaoLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/clube?ref=${membro.codigo_indicacao}`
      : `/clube?ref=${membro.codigo_indicacao}`;

  function copyLink() {
    navigator.clipboard.writeText(indicacaoLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate({ to: "/clube/login" });
  }

  return (
    <ClubeShell tier={tier}>
      <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {/* Header do perfil */}
        <div className="flex items-center gap-4">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
            style={{ background: cfg.bg, border: `2px solid ${cfg.color}` }}
          >
            {membro.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white">{membro.nome}</h1>
            <p className="text-sm text-[color:var(--ink-muted)]">{membro.email}</p>
          </div>
        </div>

        {/* Card de tier */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: cfg.border, background: cfg.bg }}
        >
          <div className="flex items-center justify-between mb-4">
            <TierBadge tier={tier} size="lg" />
            <span className="text-sm text-[color:var(--ink-muted)]">
              {membro.meses_contrato} mes{membro.meses_contrato !== 1 ? "es" : ""}
            </span>
          </div>

          {/* Linha do tier */}
          <div className="flex items-center gap-2 mb-3">
            {TIER_ORDER.map((t, i) => {
              const tcfg = TIER_CONFIG[t];
              const isCurrent = t === tier;
              const isPast = TIER_ORDER.indexOf(t) < TIER_ORDER.indexOf(tier);
              return (
                <div key={t} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="h-2 w-full rounded-full"
                    style={{
                      background: isCurrent || isPast ? tcfg.color : "rgba(255,255,255,0.08)",
                    }}
                  />
                  <span
                    className="text-[9px] font-semibold uppercase"
                    style={{ color: isCurrent ? tcfg.color : "var(--ink-muted)" }}
                  >
                    {tcfg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {nextTier && nextCfg ? (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(progress, 100)}%`, background: nextCfg.color }}
                />
              </div>
              <p className="text-xs text-[color:var(--ink-muted)]">
                Faltam{" "}
                <span className="font-semibold text-white">{mesesParaProximo} mes{mesesParaProximo !== 1 ? "es" : ""}</span>{" "}
                para o tier{" "}
                <span style={{ color: nextCfg.color }}>{nextCfg.label}</span>
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold" style={{ color: cfg.color }}>
              Você atingiu o tier máximo ✦
            </p>
          )}
        </div>

        {/* Pontos */}
        <div
          className="flex items-center justify-between rounded-xl border p-4"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
        >
          <div>
            <p className="text-xs text-[color:var(--ink-muted)] uppercase tracking-wider">Pontos acumulados</p>
            <p className="font-display text-2xl font-extrabold text-white mt-0.5">{membro.pontos}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[color:var(--ink-muted)]">Use nos benefícios</p>
            <p className="text-[10px] text-[color:var(--ink-muted)] mt-0.5">em breve</p>
          </div>
        </div>

        {/* Indicação */}
        <section>
          <h2 className="font-display text-base font-bold text-white mb-3">
            Programa de indicação
          </h2>
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "rgba(0,230,118,0.15)", background: "rgba(0,230,118,0.04)" }}
          >
            <p className="text-sm text-[color:var(--ink-muted)] mb-4">
              Compartilhe seu link exclusivo. A cada novo motorista aprovado, você ganha{" "}
              <span className="font-semibold text-white">500 pontos</span>.
            </p>

            <div
              className="flex items-center gap-3 rounded-lg border px-4 py-3 mb-3"
              style={{ borderColor: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}
            >
              <span className="flex-1 truncate text-xs text-white font-mono">{indicacaoLink}</span>
              <button
                onClick={copyLink}
                className="shrink-0 grid h-8 w-8 place-items-center rounded-md transition-colors"
                style={{ background: copied ? "rgba(0,230,118,0.15)" : "rgba(255,255,255,0.06)" }}
                aria-label="Copiar link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[color:var(--gain)]" />
                ) : (
                  <Copy className="h-4 w-4 text-[color:var(--ink-muted)]" />
                )}
              </button>
            </div>

            <p className="text-center text-[10px] text-[color:var(--ink-muted)]">
              Código:{" "}
              <span className="font-bold text-white uppercase tracking-widest">
                {membro.codigo_indicacao}
              </span>
            </p>
          </div>
        </section>

        {/* Links rápidos */}
        <section className="rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <QuickLink label="Benefícios disponíveis" to="/clube/beneficios" />
          <QuickLink label="Início do clube" to="/clube/dashboard" />
          <Link
            to="/"
            className="flex items-center justify-between px-4 py-4 text-sm text-[color:var(--ink-muted)] transition-colors hover:bg-white/[0.03] border-t"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <span>Site e-Drive Go</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-4 text-sm font-semibold text-[color:var(--loss)] transition-colors hover:bg-[color:var(--loss)]/[0.06] disabled:opacity-60"
          style={{ borderColor: "rgba(240,68,56,0.20)" }}
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Saindo..." : "Sair da conta"}
        </button>

        <p className="pb-4 text-center text-xs text-[color:var(--ink-muted)]">
          Clube e-Drive Go · {firstName}, motorista parceiro
        </p>
      </div>
    </ClubeShell>
  );
}

function QuickLink({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to as "/clube/beneficios" | "/clube/dashboard"}
      className="flex items-center justify-between px-4 py-4 text-sm text-[color:var(--ink-muted)] transition-colors hover:bg-white/[0.03] border-b last:border-b-0"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[color:var(--gain)]" />
    </div>
  );
}
