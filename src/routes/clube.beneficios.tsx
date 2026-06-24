import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClubeShell } from "@/components/clube/ClubeShell";
import { TierBadge } from "@/components/clube/TierBadge";
import {
  type Membro,
  type BeneficioStatic,
  type Tier,
  getOrCreateMembro,
  tierProgress,
  BENEFICIOS,
  CATEGORIAS,
  TIER_CONFIG,
  canAccess,
} from "@/lib/clube";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/clube/beneficios")({
  component: ProtectedBeneficios,
});

function ProtectedBeneficios() {
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
  return <Beneficios membro={membro!} />;
}

function Beneficios({ membro }: { membro: Membro }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState("todas");
  const { tier } = tierProgress(membro.meses_contrato);

  const filtrados =
    categoriaAtiva === "todas"
      ? BENEFICIOS
      : BENEFICIOS.filter((b) => b.categoria_id === categoriaAtiva);

  const disponiveis = filtrados.filter((b) => canAccess(tier, b.tier_minimo) && !b.em_breve).length;
  const emBreve = filtrados.filter((b) => b.em_breve).length;
  const bloqueados = filtrados.filter((b) => !canAccess(tier, b.tier_minimo)).length;

  return (
    <ClubeShell tier={tier}>
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--ink)" }}>Benefícios</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            {disponiveis} disponíve{disponiveis !== 1 ? "is" : "l"} ·{" "}
            {emBreve} em breve ·{" "}
            {bloqueados > 0 && `${bloqueados} bloqueado${bloqueados !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Filtro de categorias */}
        <div className="mb-5 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIAS.map((cat) => {
              const active = categoriaAtiva === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    borderColor: active ? "var(--gain)" : "var(--input-border)",
                    background: active ? "rgba(0,230,118,0.10)" : "transparent",
                    color: active ? "var(--gain)" : "var(--ink-muted)",
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de benefícios */}
        <div className="space-y-3">
          {filtrados.map((b) => (
            <BenefitCard key={b.id} beneficio={b} memberTier={tier} />
          ))}
          {filtrados.length === 0 && (
            <div className="py-16 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
              Nenhum benefício nesta categoria ainda.
            </div>
          )}
        </div>
      </div>
    </ClubeShell>
  );
}

function BenefitCard({
  beneficio,
  memberTier,
}: {
  beneficio: BeneficioStatic;
  memberTier: Tier;
}) {
  const isLocked = !canAccess(memberTier, beneficio.tier_minimo);
  const reqCfg = TIER_CONFIG[beneficio.tier_minimo];
  const cat = CATEGORIAS.find((c) => c.id === beneficio.categoria_id);

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-4 transition-all"
      style={{
        borderColor: isLocked ? "var(--card-border-dim)" : "var(--card-border)",
        background: isLocked ? "var(--card-bg-dim)" : "var(--card-bg)",
      }}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-xl"
          style={{ backdropFilter: "blur(2px)", background: "var(--lock-bg)" }}
        >
          <Lock className="h-5 w-5" style={{ color: reqCfg.color }} />
          <span className="text-xs font-semibold" style={{ color: reqCfg.color }}>
            Disponível no {reqCfg.label}
          </span>
        </div>
      )}

      <div className={`flex items-start gap-3 ${isLocked ? "opacity-40" : ""}`}>
        {/* Ícone da categoria */}
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-xl"
          style={{ borderColor: "var(--card-border)" }}
        >
          {cat?.icon ?? "✦"}
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                {cat?.label}
              </p>
              <h3 className="font-display text-sm font-bold leading-snug" style={{ color: "var(--ink)" }}>
                {beneficio.titulo}
              </h3>
            </div>
            <TierBadge tier={beneficio.tier_minimo} size="sm" />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            {beneficio.descricao}
          </p>
          <div className="mt-3">
            {beneficio.em_breve ? (
              <span
                className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: "var(--card-bg)", color: "var(--ink-muted)" }}
              >
                Em breve
              </span>
            ) : (
              <span
                className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold"
                style={{ background: "rgba(0,230,118,0.10)", color: "var(--gain)" }}
              >
                {beneficio.valor}
              </span>
            )}
          </div>
        </div>
      </div>
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
