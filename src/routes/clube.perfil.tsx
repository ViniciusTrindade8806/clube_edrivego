import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ClubeShell } from "@/components/clube/ClubeShell";
import { TierBadge } from "@/components/clube/TierBadge";
import {
  type Membro,
  getOrCreateMembro,
  tierProgress,
  TIER_CONFIG,
  TIER_ORDER,
  TIER_GLOW,
  BENEFICIOS,
  canAccess,
} from "@/lib/clube";
import { supabase } from "@/lib/supabase";
import { Copy, Check, LogOut, ChevronRight, Camera, Lock } from "lucide-react";

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
      else { setMembro(m); setLoading(false); }
    });
  }, [navigate]);

  if (loading) return <FullLoader />;
  return <Perfil membro={membro!} />;
}

function Perfil({ membro: membroInicial }: { membro: Membro }) {
  const [membro, setMembro] = useState(membroInicial);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setImgError(false);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${membro.id}/avatar.${ext}`;
    const { error: storageError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (storageError) {
      setUploadError(`Erro no upload: ${storageError.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    const { error: dbError } = await supabase
      .from("membros")
      .update({ avatar_url: url })
      .eq("id", membro.id);
    if (dbError) {
      setUploadError(`Erro ao salvar: ${dbError.message}`);
    } else {
      setMembro((prev) => ({ ...prev, avatar_url: url }));
    }
    setUploading(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate({ to: "/clube/login" });
  }

  return (
    <ClubeShell tier={tier}>
      <div className="mx-auto max-w-lg px-4 py-6 space-y-5">

        {/* ── Avatar + nome ── */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className={`h-20 w-20 rounded-full overflow-hidden ${tier === "ouro" ? "tier-ouro-pulse" : ""}`}
              style={{
                border: `3px solid ${cfg.color}`,
                boxShadow: tier !== "ouro" ? TIER_GLOW[tier] : undefined,
              }}
            >
              {membro.avatar_url && !imgError ? (
                <img
                  src={membro.avatar_url}
                  alt="avatar"
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {membro.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Trocar foto"
              className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full disabled:opacity-50"
              style={{ background: "#4B0081", border: "2px solid var(--glass)" }}
            >
              {uploading
                ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-white" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
                : <Camera className="h-3.5 w-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          {uploadError && (
            <p className="text-xs mt-1" style={{ color: "var(--loss)" }}>{uploadError}</p>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold truncate" style={{ color: "var(--ink)" }}>{membro.nome}</h1>
            <p className="text-sm truncate" style={{ color: "var(--ink-muted)" }}>{membro.email}</p>
            <div className="mt-1.5">
              <TierBadge tier={tier} size="sm" glow />
            </div>
          </div>
        </div>

        {/* ── Progressão ── */}
        <div className="rounded-xl border p-5" style={{ borderColor: cfg.border, background: cfg.bg }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              {membro.meses_contrato} mes{membro.meses_contrato !== 1 ? "es" : ""} de contrato
            </span>
            {nextTier && nextCfg ? (
              <span className="text-xs" style={{ color: nextCfg.color }}>
                {mesesParaProximo} mes{mesesParaProximo !== 1 ? "es" : ""} → {nextCfg.label}
              </span>
            ) : (
              <span className="text-xs font-semibold" style={{ color: cfg.color }}>Tier máximo ✦</span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--hairline)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%`, background: cfg.color }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px]">
            {TIER_ORDER.map((t) => {
              const tc = TIER_CONFIG[t];
              return (
                <span key={t} style={{ color: t === tier ? tc.color : "var(--ink-muted)" }}>
                  {tc.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Pontos ── */}
        <div className="flex items-center justify-between rounded-xl border p-4"
          style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>Pontos acumulados</p>
            <p className="font-display text-3xl font-extrabold mt-0.5" style={{ color: "var(--ink)" }}>{membro.pontos}</p>
          </div>
          <Link to="/clube/resgates"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold"
            style={{ background: "rgba(0,230,118,0.12)", color: "var(--gain)" }}>
            Resgatar →
          </Link>
        </div>

        {/* ── Jornada dos tiers ── */}
        <section>
          <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--ink)" }}>
            Jornada de tiers
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {TIER_ORDER.map((t) => {
              const tc = TIER_CONFIG[t];
              const isCurrent = t === tier;
              const isPast = TIER_ORDER.indexOf(t) < TIER_ORDER.indexOf(tier);
              const isLocked = TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(tier);
              const count = BENEFICIOS.filter((b) => b.tier_minimo === t && !b.em_breve).length;
              const key = BENEFICIOS.filter((b) => b.tier_minimo === t && !b.em_breve).slice(0, 2);

              return (
                <div key={t}
                  className={`rounded-xl border p-3 flex flex-col gap-2 relative overflow-hidden ${isCurrent && t === "ouro" ? "tier-ouro-pulse" : ""}`}
                  style={{
                    borderColor: isCurrent ? tc.color : isLocked ? "var(--card-border-dim)" : tc.border,
                    background: isCurrent ? tc.bg : isPast ? `${tc.bg}` : "var(--card-bg-dim)",
                    boxShadow: isCurrent ? TIER_GLOW[t] : isPast ? TIER_GLOW[t] : undefined,
                    opacity: isLocked ? 0.55 : 1,
                  }}>
                  {/* Badge de status */}
                  {isCurrent && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-bold uppercase px-1 py-0.5 rounded"
                      style={{ background: tc.color, color: "#000" }}>
                      Atual
                    </span>
                  )}
                  {isPast && (
                    <span className="absolute top-1.5 right-1.5 text-[9px]">✓</span>
                  )}
                  {isLocked && (
                    <Lock className="absolute top-1.5 right-1.5 h-3 w-3" style={{ color: tc.color }} />
                  )}
                  <p className="font-display text-xs font-extrabold" style={{ color: tc.color }}>{tc.label}</p>
                  <p className="text-[9px]" style={{ color: "var(--ink-muted)" }}>
                    {tc.min_meses}+ meses
                  </p>
                  <div className="border-t pt-2" style={{ borderColor: "var(--hairline)" }}>
                    <p className="text-[9px] font-bold mb-1"
                      style={{ color: isLocked ? "var(--ink-muted)" : tc.color }}>
                      {isPast ? "✓ Conquistado" : `+${count} exclusivos`}
                    </p>
                    {key.map((b) => (
                      <p key={b.id} className="text-[8px] truncate" style={{ color: "var(--ink-muted)" }}>
                        · {b.titulo}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Indicação ── */}
        <section>
          <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--ink)" }}>
            Programa de indicação
          </h2>
          <div className="rounded-xl border p-5"
            style={{ borderColor: "rgba(0,230,118,0.15)", background: "rgba(0,230,118,0.04)" }}>
            <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
              Compartilhe seu link. A cada novo motorista aprovado, você ganha{" "}
              <span className="font-semibold" style={{ color: "var(--ink)" }}>500 pontos</span>.
            </p>
            <div className="flex items-center gap-3 rounded-lg border px-4 py-3 mb-3"
              style={{ borderColor: "var(--input-border)", background: "var(--input-bg)" }}>
              <span className="flex-1 truncate text-xs font-mono" style={{ color: "var(--ink)" }}>{indicacaoLink}</span>
              <button onClick={copyLink}
                className="shrink-0 grid h-8 w-8 place-items-center rounded-md transition-colors"
                style={{ background: copied ? "rgba(0,230,118,0.15)" : "var(--card-bg)" }}>
                {copied
                  ? <Check className="h-4 w-4" style={{ color: "var(--gain)" }} />
                  : <Copy className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />}
              </button>
            </div>
            <p className="text-center text-[10px]" style={{ color: "var(--ink-muted)" }}>
              Código:{" "}
              <span className="font-bold uppercase tracking-widest" style={{ color: "var(--ink)" }}>
                {membro.codigo_indicacao}
              </span>
            </p>
          </div>
        </section>

        {/* ── Links rápidos ── */}
        <section className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--card-border)" }}>
          <QuickLink label="Resgatar pontos" to="/clube/resgates" />
          <QuickLink label="Benefícios disponíveis" to="/clube/beneficios" />
          <QuickLink label="Início do clube" to="/clube/dashboard" />
          <Link to="/"
            className="flex items-center justify-between px-4 py-4 text-sm transition-colors border-t"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-muted)" }}>
            <span>Site e-Drive Go</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        {/* ── Logout ── */}
        <button onClick={handleLogout} disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-colors disabled:opacity-60"
          style={{ borderColor: "rgba(240,68,56,0.20)", color: "var(--loss)" }}>
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Saindo..." : "Sair da conta"}
        </button>

        <p className="pb-4 text-center text-xs" style={{ color: "var(--ink-muted)" }}>
          Clube e-Drive Go · {firstName}, motorista parceiro
        </p>
      </div>
    </ClubeShell>
  );
}

function QuickLink({ label, to }: { label: string; to: string }) {
  return (
    <Link to={to as "/clube/resgates" | "/clube/beneficios" | "/clube/dashboard"}
      className="flex items-center justify-between px-4 py-4 text-sm transition-colors border-b last:border-b-0"
      style={{ borderColor: "var(--hairline)", color: "var(--ink-muted)" }}>
      <span>{label}</span>
      <ChevronRight className="h-4 w-4" />
    </Link>
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
