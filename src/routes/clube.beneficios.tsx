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
import {
  getParceirosAtivos,
  CAT_PARCEIRO,
  type ParceiroComBeneficios,
  type BeneficioParceiro,
} from "@/lib/parceiros";
import { Lock, Tag, Check, RefreshCw } from "lucide-react";

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
      else { setMembro(m); setLoading(false); }
    });
  }, [navigate]);

  if (loading) return <FullLoader />;
  return <Beneficios membro={membro!} />;
}

type Aba = "clube" | "parceiros";

function Beneficios({ membro }: { membro: Membro }) {
  const [aba, setAba] = useState<Aba>("clube");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todas");
  const [parceiros, setParceiros] = useState<ParceiroComBeneficios[]>([]);
  const [loadingP, setLoadingP] = useState(false);
  const { tier } = tierProgress(membro.meses_contrato);

  useEffect(() => {
    if (aba === "parceiros" && parceiros.length === 0) {
      setLoadingP(true);
      getParceirosAtivos().then((data) => { setParceiros(data); setLoadingP(false); });
    }
  }, [aba, parceiros.length]);

  const filtrados =
    categoriaAtiva === "todas"
      ? BENEFICIOS
      : BENEFICIOS.filter((b) => b.categoria_id === categoriaAtiva);

  const disponiveis = filtrados.filter((b) => canAccess(tier, b.tier_minimo) && !b.em_breve).length;

  return (
    <ClubeShell tier={tier}>
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Segment control */}
        <div
          className="flex rounded-xl p-1 mb-5"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {(["clube", "parceiros"] as Aba[]).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
              style={{
                background: aba === a ? "#4B0081" : "transparent",
                color: aba === a ? "#fff" : "var(--ink-muted)",
              }}
            >
              {a === "clube" ? "🎖️ Clube" : "🤝 Parceiros"}
            </button>
          ))}
        </div>

        {/* ── ABA CLUBE ── */}
        {aba === "clube" && (
          <>
            <div className="mb-5">
              <h1 className="font-display text-xl font-bold" style={{ color: "var(--ink)" }}>Benefícios do Clube</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                {disponiveis} disponíve{disponiveis !== 1 ? "is" : "l"} com seu tier atual
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
          </>
        )}

        {/* ── ABA PARCEIROS ── */}
        {aba === "parceiros" && (
          <>
            <div className="mb-5">
              <h1 className="font-display text-xl font-bold" style={{ color: "var(--ink)" }}>Parceiros</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                Descontos exclusivos para motoristas e-Drive Go
              </p>
            </div>

            {loadingP ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--ink-muted)" }} />
              </div>
            ) : parceiros.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-3xl mb-3">🤝</p>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Em breve</p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                  Parceiros estão sendo negociados. Volte em breve!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {parceiros.map((p) => (
                  <ParceiroCard key={p.id} parceiro={p} memberTier={tier} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ClubeShell>
  );
}

/* ─── Benefit card (Clube) ─── */
function BenefitCard({ beneficio, memberTier }: { beneficio: BeneficioStatic; memberTier: Tier }) {
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
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-xl"
          style={{ borderColor: "var(--card-border)" }}>
          {cat?.icon ?? "✦"}
        </div>
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
              <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: "var(--card-bg)", color: "var(--ink-muted)" }}>
                Em breve
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold"
                style={{ background: "rgba(0,230,118,0.10)", color: "var(--gain)" }}>
                {beneficio.valor}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Parceiro card ─── */
function ParceiroCard({ parceiro, memberTier }: { parceiro: ParceiroComBeneficios; memberTier: Tier }) {
  const [copied, setCopied] = useState<string | null>(null);
  const cat = CAT_PARCEIRO[parceiro.categoria];

  function copyCupom(b: BeneficioParceiro) {
    if (!b.cupom) return;
    navigator.clipboard.writeText(b.cupom).then(() => {
      setCopied(b.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
      {/* Header do parceiro */}
      <div className="flex items-center gap-3 p-4">
        <div className="h-12 w-12 shrink-0 rounded-xl border flex items-center justify-center text-2xl"
          style={{ borderColor: "var(--card-border)", background: "var(--card-bg-dim)" }}>
          {parceiro.logo_emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold" style={{ color: "var(--ink)" }}>{parceiro.nome}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
            {cat.icon} {cat.label} · {parceiro.cidade}
          </p>
          {parceiro.descricao && (
            <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>{parceiro.descricao}</p>
          )}
        </div>
      </div>

      {/* Benefícios do parceiro */}
      {parceiro.beneficios_parceiros.length > 0 && (
        <div className="border-t divide-y" style={{ borderColor: "var(--hairline)" }}>
          {parceiro.beneficios_parceiros.map((b) => {
            const isLocked = !canAccess(memberTier, b.tier_minimo);
            const tcfg = TIER_CONFIG[b.tier_minimo];

            return (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{b.titulo}</p>
                  {b.descricao && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{b.descricao}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ color: tcfg.color, background: tcfg.bg }}>
                      {tcfg.label}+
                    </span>
                    {b.desconto_pct && (
                      <span className="text-[10px] font-bold" style={{ color: "var(--gain)" }}>
                        {b.desconto_pct}% off
                      </span>
                    )}
                    {b.validade && (
                      <span className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                        até {new Date(b.validade).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cupom ou cadeado */}
                {isLocked ? (
                  <div className="shrink-0 flex flex-col items-center gap-0.5">
                    <Lock className="h-4 w-4" style={{ color: tcfg.color }} />
                    <span className="text-[9px] font-bold uppercase" style={{ color: tcfg.color }}>
                      {tcfg.label}
                    </span>
                  </div>
                ) : b.cupom ? (
                  <button
                    onClick={() => copyCupom(b)}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all"
                    style={{
                      background: copied === b.id ? "rgba(0,230,118,0.15)" : "rgba(0,230,118,0.10)",
                      color: "var(--gain)",
                    }}
                  >
                    {copied === b.id ? (
                      <><Check className="h-3.5 w-3.5" /> Copiado</>
                    ) : (
                      <><Tag className="h-3.5 w-3.5" /> {b.cupom}</>
                    )}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-[color:var(--gain)]"
        style={{ borderColor: "var(--hairline)" }} />
    </div>
  );
}
