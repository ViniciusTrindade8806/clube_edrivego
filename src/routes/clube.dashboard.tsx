import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClubeShell } from "@/components/clube/ClubeShell";
import { TierBadge } from "@/components/clube/TierBadge";
import {
  type Membro,
  getOrCreateMembro,
  tierProgress,
  TIER_CONFIG,
  TIER_ORDER,
  BENEFICIOS,
  CATEGORIAS,
  canAccess,
} from "@/lib/clube";
import { Gift, Star, Users, Zap, ArrowRight, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/clube/dashboard")({
  component: ProtectedDashboard,
});

function ProtectedDashboard() {
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
  return <Dashboard membro={membro!} />;
}

function Dashboard({ membro }: { membro: Membro }) {
  const { tier, progress, mesesParaProximo } = tierProgress(membro.meses_contrato);
  const cfg = TIER_CONFIG[tier];
  const nextTier = cfg.next;
  const nextCfg = nextTier ? TIER_CONFIG[nextTier] : null;

  const disponiveis = BENEFICIOS.filter(
    (b) => canAccess(tier, b.tier_minimo) && !b.em_breve
  ).length;

  const destaques = BENEFICIOS.filter(
    (b) => canAccess(tier, b.tier_minimo) && !b.em_breve
  ).slice(0, 3);

  const firstName = membro.nome.split(" ")[0];

  return (
    <ClubeShell tier={tier}>
      <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {/* Saudação */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: cfg.border, background: cfg.bg }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
                Olá, {firstName} 👋
              </p>
              <h1 className="font-display text-xl font-bold" style={{ color: "var(--ink)" }}>
                Bem-vindo ao Clube
              </h1>
            </div>
            <TierBadge tier={tier} size="md" />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                {membro.meses_contrato} mes{membro.meses_contrato !== 1 ? "es" : ""} de contrato
              </span>
              {nextTier && nextCfg ? (
                <span className="text-xs font-medium" style={{ color: nextCfg.color }}>
                  {mesesParaProximo} mes{mesesParaProximo !== 1 ? "es" : ""} para {nextCfg.label}
                </span>
              ) : (
                <span className="text-xs font-medium" style={{ color: cfg.color }}>
                  Tier máximo ✦
                </span>
              )}
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--hairline)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: nextTier && nextCfg ? nextCfg.color : cfg.color,
                }}
              />
            </div>

            {nextTier && (
              <div className="mt-2 flex justify-between text-[10px]" style={{ color: "var(--ink-muted)" }}>
                <span style={{ color: cfg.color }}>{cfg.label}</span>
                <span style={{ color: nextCfg?.color }}>{nextCfg?.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Gift className="h-4 w-4" />}
            value={String(disponiveis)}
            label="Benefícios"
            color="var(--gain)"
          />
          <StatCard
            icon={<Star className="h-4 w-4" />}
            value={String(membro.pontos)}
            label="Pontos"
            color="var(--gain)"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            value={membro.meses_contrato > 0 ? String(membro.meses_contrato) : "—"}
            label="Meses"
            color="var(--gain)"
          />
        </div>

        {/* Benefícios destaque */}
        {destaques.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold" style={{ color: "var(--ink)" }}>
                Disponíveis agora
              </h2>
              <Link
                to="/clube/beneficios"
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--gain)" }}
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {destaques.map((b) => {
                const cat = CATEGORIAS.find((c) => c.id === b.categoria_id);
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-lg border p-4"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                  >
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-lg"
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      {cat?.icon ?? "✦"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--ink)" }}>{b.titulo}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--ink-muted)" }}>{b.descricao}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "rgba(0,230,118,0.10)", color: "var(--gain)" }}
                    >
                      {b.valor}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Próximos tiers */}
        {tier !== "ouro" && (
          <section>
            <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--ink)" }}>
              Desbloqueie no próximo tier
            </h2>
            <div className="space-y-3">
              {BENEFICIOS.filter(
                (b) => !canAccess(tier, b.tier_minimo) && b.tier_minimo === (TIER_ORDER[TIER_ORDER.indexOf(tier) + 1])
              ).slice(0, 3).map((b) => {
                const cat = CATEGORIAS.find((c) => c.id === b.categoria_id);
                const reqCfg = TIER_CONFIG[b.tier_minimo];
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-lg border p-4 opacity-50"
                    style={{ borderColor: "var(--card-border-dim)", background: "var(--card-bg-dim)" }}
                  >
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-lg"
                      style={{ borderColor: "var(--card-border-dim)" }}
                    >
                      {cat?.icon ?? "✦"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--ink)" }}>{b.titulo}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--ink-muted)" }}>{b.descricao}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Lock className="h-3.5 w-3.5" style={{ color: reqCfg.color }} />
                      <span className="text-[9px] font-bold uppercase" style={{ color: reqCfg.color }}>
                        {reqCfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA indicação */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "rgba(0,230,118,0.15)", background: "rgba(0,230,118,0.04)" }}
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: "rgba(0,230,118,0.10)" }}>
              <Zap className="h-5 w-5" style={{ color: "var(--gain)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>Indique e ganhe pontos</p>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                500 pontos por cada motorista aprovado que você indicar.
              </p>
              <Link
                to="/clube/perfil"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--gain)" }}
              >
                Ver meu código <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClubeShell>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border p-4 text-center"
      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
    >
      <div className="mb-2 flex justify-center" style={{ color }}>
        {icon}
      </div>
      <div className="font-display text-lg font-extrabold" style={{ color: "var(--ink)" }}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>{label}</div>
    </div>
  );
}

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-[color:var(--gain)]" style={{ borderColor: "var(--hairline)" }} />
    </div>
  );
}
