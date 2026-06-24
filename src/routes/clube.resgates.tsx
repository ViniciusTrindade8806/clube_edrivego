import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClubeShell } from "@/components/clube/ClubeShell";
import { getOrCreateMembro, type Membro, tierProgress } from "@/lib/clube";
import { supabase } from "@/lib/supabase";
import {
  CATALOGO,
  getTransacoes,
  getMeusResgates,
  type Recompensa,
  type PontoTransacao,
  type Resgate,
} from "@/lib/pontos";
import { ArrowLeft, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, PartyPopper } from "lucide-react";

export const Route = createFileRoute("/clube/resgates")({
  component: ProtectedResgates,
});

function ProtectedResgates() {
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
  return <Resgates membro={membro!} />;
}

type Aba = "catalogo" | "meus";

function Resgates({ membro: membroInicial }: { membro: Membro }) {
  const [membro, setMembro] = useState(membroInicial);
  const [transacoes, setTransacoes] = useState<PontoTransacao[]>([]);
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [aba, setAba] = useState<Aba>("catalogo");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [popup, setPopup] = useState<Recompensa | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);

  const { tier } = tierProgress(membro.meses_contrato);

  useEffect(() => {
    Promise.all([
      getTransacoes(membro.id),
      getMeusResgates(membro.id),
    ]).then(([t, r]) => {
      setTransacoes(t);
      setResgates(r);
      setLoadingData(false);
    });
  }, [membro.id]);

  async function solicitarResgate(recompensa: Recompensa) {
    if (membro.pontos < recompensa.pontos) return;
    setSalvando(true);
    const novosPontos = membro.pontos - recompensa.pontos;

    await supabase.from("membros").update({ pontos: novosPontos }).eq("id", membro.id);
    await supabase.from("pontos_transacoes").insert({
      membro_id: membro.id,
      valor: -recompensa.pontos,
      descricao: `Resgate: ${recompensa.titulo}`,
      tipo: "resgate",
    });
    const { data: novoResgate } = await supabase.from("resgates").insert({
      membro_id: membro.id,
      recompensa: recompensa.titulo,
      pontos_custo: recompensa.pontos,
    }).select().single();

    if (novoResgate) {
      setMembro((prev) => ({ ...prev, pontos: novosPontos }));
      setResgates((prev) => [novoResgate as Resgate, ...prev]);
      setTransacoes((prev) => [{
        id: crypto.randomUUID(),
        membro_id: membro.id,
        valor: -recompensa.pontos,
        descricao: `Resgate: ${recompensa.titulo}`,
        tipo: "resgate",
        created_at: new Date().toISOString(),
      }, ...prev]);
      setPopup(recompensa);
    }
    setConfirmId(null);
    setSalvando(false);
  }

  const pendentes = resgates.filter((r) => r.status === "pendente").length;
  const aprovados = resgates.filter((r) => r.status === "aprovado");

  return (
    <ClubeShell tier={tier}>

      {/* ── Popup de sucesso ── */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setPopup(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{ background: "var(--glass)", border: "1px solid var(--card-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">{popup.icone}</div>
            <div className="flex justify-center mb-3">
              <PartyPopper className="h-8 w-8" style={{ color: "var(--gain)" }} />
            </div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>
              Resgate feito!
            </h2>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>{popup.titulo}</p>
            <p className="text-xs mb-5" style={{ color: "var(--ink-muted)" }}>{popup.descricao}</p>
            <div className="rounded-xl p-4 mb-5"
              style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.18)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>Pontos utilizados</p>
              <p className="font-display text-2xl font-extrabold" style={{ color: "var(--gain)" }}>
                −{popup.pontos} pts
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                Saldo restante: <strong style={{ color: "var(--ink)" }}>{membro.pontos}</strong>
              </p>
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--ink-muted)" }}>
              Seu pedido está sendo processado pela equipe e-Drive Go. Acompanhe em <strong>Meus Resgates</strong>.
            </p>
            <button
              onClick={() => { setPopup(null); setAba("meus"); }}
              className="w-full rounded-xl py-3 font-semibold text-sm mb-2 text-white"
              style={{ background: "#4B0081" }}>
              Ver meus resgates
            </button>
            <button onClick={() => setPopup(null)}
              className="w-full rounded-xl py-3 text-sm"
              style={{ color: "var(--ink-muted)" }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-lg px-4 py-6 space-y-5">

        {/* Header */}
        <div>
          <Link to="/clube/perfil"
            className="flex items-center gap-1.5 text-xs mb-4"
            style={{ color: "var(--ink-muted)" }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao perfil
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold" style={{ color: "var(--ink)" }}>Resgatar Pontos</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--ink-muted)" }}>
                Saldo:{" "}
                <span className="font-bold text-base" style={{ color: "var(--gain)" }}>{membro.pontos}</span> pts
              </p>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex rounded-xl p-1"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          {([["catalogo", "🛍️ Catálogo"], ["meus", `🎟️ Meus Resgates${pendentes > 0 ? ` (${pendentes})` : ""}`]] as [Aba, string][]).map(([a, label]) => (
            <button key={a} onClick={() => setAba(a)}
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
              style={{
                background: aba === a ? "#4B0081" : "transparent",
                color: aba === a ? "#fff" : "var(--ink-muted)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ABA CATÁLOGO ── */}
        {aba === "catalogo" && (
          <div className="space-y-3">
            {CATALOGO.map((r) => {
              const temPontos = membro.pontos >= r.pontos;
              const isConfirming = confirmId === r.id;
              const jaResgatado = resgates.some(
                (res) => res.recompensa === r.titulo && res.status === "pendente"
              );

              return (
                <div key={r.id} className="rounded-xl border overflow-hidden"
                  style={{
                    borderColor: temPontos && !jaResgatado ? "var(--card-border)" : "var(--card-border-dim)",
                    background: temPontos && !jaResgatado ? "var(--card-bg)" : "var(--card-bg-dim)",
                  }}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="text-4xl shrink-0">{r.icone}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold" style={{ color: "var(--ink)" }}>{r.titulo}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{r.descricao}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display font-extrabold text-lg"
                        style={{ color: temPontos ? "var(--gain)" : "var(--ink-muted)" }}>
                        {r.pontos}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--ink-muted)" }}>pts</p>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    {jaResgatado ? (
                      <div className="rounded-lg px-3 py-2 text-xs text-center font-semibold"
                        style={{ background: "rgba(255,200,0,0.08)", color: "#C9A227" }}>
                        ⏳ Aguardando aprovação
                      </div>
                    ) : isConfirming ? (
                      <div className="flex gap-2">
                        <button onClick={() => solicitarResgate(r)} disabled={salvando}
                          className="flex-1 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 text-white"
                          style={{ background: "#4B0081" }}>
                          {salvando ? "Solicitando…" : `✓ Confirmar — ${r.pontos} pts`}
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="rounded-lg px-4 py-2.5 text-sm border"
                          style={{ borderColor: "var(--card-border)", color: "var(--ink-muted)" }}>
                          Cancelar
                        </button>
                      </div>
                    ) : temPontos ? (
                      <button onClick={() => setConfirmId(r.id)}
                        className="w-full rounded-lg py-2.5 text-sm font-semibold"
                        style={{ background: "rgba(0,230,118,0.12)", color: "var(--gain)" }}>
                        Resgatar {r.pontos} pontos
                      </button>
                    ) : (
                      <div className="rounded-lg px-3 py-2 text-xs text-center"
                        style={{ background: "var(--card-bg-dim)", color: "var(--ink-muted)" }}>
                        Faltam <strong>{r.pontos - membro.pontos}</strong> pontos
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ABA MEUS RESGATES ── */}
        {aba === "meus" && (
          <div className="space-y-4">
            {/* Aprovados com código — destaque */}
            {aprovados.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: "var(--gain)" }}>
                  ✅ Prontos para usar
                </h3>
                {aprovados.map((r) => (
                  <div key={r.id} className="rounded-xl border p-4 mb-3"
                    style={{
                      borderColor: "rgba(0,230,118,0.25)",
                      background: "rgba(0,230,118,0.05)",
                    }}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="font-display font-bold" style={{ color: "var(--ink)" }}>{r.recompensa}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.codigo ? (
                      <>
                        <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>Seu código:</p>
                        <CopyCode code={r.codigo} />
                      </>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                        Apresente este resgate ao atendente e-Drive Go.
                      </p>
                    )}
                    <p className="text-[10px] mt-3" style={{ color: "var(--ink-muted)" }}>
                      Aprovado em {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Pendentes */}
            {resgates.filter((r) => r.status === "pendente").length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: "#C9A227" }}>
                  ⏳ Aguardando aprovação
                </h3>
                {resgates.filter((r) => r.status === "pendente").map((r) => (
                  <div key={r.id} className="rounded-xl border p-4 mb-2"
                    style={{ borderColor: "rgba(201,162,39,0.20)", background: "rgba(201,162,39,0.05)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{r.recompensa}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                          {new Date(r.created_at).toLocaleDateString("pt-BR")} · {r.pontos_custo} pts
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                      Aguardando aprovação da equipe e-Drive Go.
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Rejeitados */}
            {resgates.filter((r) => r.status === "rejeitado").length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: "var(--loss)" }}>
                  ❌ Não aprovados
                </h3>
                {resgates.filter((r) => r.status === "rejeitado").map((r) => (
                  <div key={r.id} className="rounded-xl border p-4 mb-2"
                    style={{ borderColor: "var(--card-border-dim)", background: "var(--card-bg-dim)", opacity: 0.7 }}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{r.recompensa}</p>
                        <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                          {new Date(r.created_at).toLocaleDateString("pt-BR")} · {r.pontos_custo} pts
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resgates.length === 0 && !loadingData && (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">🎟️</p>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Nenhum resgate ainda</p>
                <p className="text-xs mt-1 mb-5" style={{ color: "var(--ink-muted)" }}>
                  Troque seus pontos por recompensas no catálogo
                </p>
                <button onClick={() => setAba("catalogo")}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "#4B0081" }}>
                  Ver catálogo
                </button>
              </div>
            )}

            {/* Histórico de pontos */}
            {!loadingData && transacoes.length > 0 && (
              <div className="border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
                <button onClick={() => setShowHistorico((v) => !v)}
                  className="flex w-full items-center justify-between py-1 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Histórico de pontos
                  </span>
                  {showHistorico
                    ? <ChevronUp className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />
                    : <ChevronDown className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />}
                </button>
                {showHistorico && (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--card-border)" }}>
                    {transacoes.map((t) => (
                      <div key={t.id}
                        className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                        style={{ borderColor: "var(--hairline)" }}>
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: "var(--ink)" }}>
                            {t.descricao ?? (t.valor > 0 ? "Pontos adicionados" : "Pontos removidos")}
                          </p>
                          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                            {new Date(t.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <p className="font-bold text-sm shrink-0 ml-3"
                          style={{ color: t.valor > 0 ? "var(--gain)" : "var(--loss)" }}>
                          {t.valor > 0 ? "+" : ""}{t.valor}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ClubeShell>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy}
      className="w-full flex items-center justify-between rounded-xl px-4 py-3 font-mono font-bold text-lg transition-all"
      style={{
        background: copied ? "rgba(0,230,118,0.15)" : "rgba(0,230,118,0.08)",
        border: "1px solid rgba(0,230,118,0.25)",
        color: "var(--gain)",
      }}>
      <span className="tracking-widest">{code}</span>
      <span className="text-xs font-sans font-semibold">
        {copied ? "✓ Copiado" : "Copiar"}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pendente") return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: "rgba(201,162,39,0.12)", color: "#C9A227" }}>
      <Clock className="h-3 w-3" /> Pendente
    </span>
  );
  if (status === "aprovado") return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: "rgba(0,230,118,0.12)", color: "var(--gain)" }}>
      <CheckCircle className="h-3 w-3" /> Aprovado
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: "rgba(240,68,56,0.12)", color: "var(--loss)" }}>
      <XCircle className="h-3 w-3" /> Rejeitado
    </span>
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
