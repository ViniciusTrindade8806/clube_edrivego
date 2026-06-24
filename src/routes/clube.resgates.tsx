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
import { ArrowLeft, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

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

function Resgates({ membro: membroInicial }: { membro: Membro }) {
  const [membro, setMembro] = useState(membroInicial);
  const [transacoes, setTransacoes] = useState<PontoTransacao[]>([]);
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
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
    }
    setConfirmId(null);
    setSalvando(false);
  }

  const pendentes = resgates.filter((r) => r.status === "pendente").length;

  return (
    <ClubeShell tier={tier}>
      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <Link to="/clube/perfil"
            className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
            style={{ color: "var(--ink-muted)" }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao perfil
          </Link>
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--ink)" }}>
            Resgatar Pontos
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
            Você tem{" "}
            <span className="font-bold text-lg" style={{ color: "var(--gain)" }}>
              {membro.pontos}
            </span>{" "}
            pontos disponíveis
          </p>
        </div>

        {/* Catálogo de recompensas */}
        <section>
          <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--ink)" }}>
            Recompensas disponíveis
          </h2>
          <div className="space-y-3">
            {CATALOGO.map((r) => {
              const temPontos = membro.pontos >= r.pontos;
              const isConfirming = confirmId === r.id;
              const jaResgatado = resgates.some(
                (res) => res.recompensa === r.titulo && res.status === "pendente"
              );

              return (
                <div key={r.id} className="rounded-xl border p-4"
                  style={{
                    borderColor: temPontos ? "var(--card-border)" : "var(--card-border-dim)",
                    background: temPontos ? "var(--card-bg)" : "var(--card-bg-dim)",
                    opacity: jaResgatado ? 0.7 : 1,
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{r.icone}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold" style={{ color: "var(--ink)" }}>{r.titulo}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{r.descricao}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-sm" style={{ color: temPontos ? "var(--gain)" : "var(--ink-muted)" }}>
                        {r.pontos} pts
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    {jaResgatado ? (
                      <p className="text-xs text-center py-1" style={{ color: "var(--ink-muted)" }}>
                        ⏳ Aguardando aprovação
                      </p>
                    ) : isConfirming ? (
                      <div className="flex gap-2">
                        <button onClick={() => solicitarResgate(r)} disabled={salvando}
                          className="flex-1 rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
                          style={{ background: "rgba(0,230,118,0.15)", color: "var(--gain)" }}>
                          {salvando ? "Solicitando…" : "✓ Confirmar resgate"}
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="rounded-lg px-4 py-2 text-sm" style={{ color: "var(--ink-muted)" }}>
                          Cancelar
                        </button>
                      </div>
                    ) : temPontos ? (
                      <button onClick={() => setConfirmId(r.id)}
                        className="w-full rounded-lg py-2 text-sm font-semibold"
                        style={{ background: "rgba(0,230,118,0.12)", color: "var(--gain)" }}>
                        Resgatar {r.pontos} pontos
                      </button>
                    ) : (
                      <p className="text-center text-xs py-1" style={{ color: "var(--ink-muted)" }}>
                        Faltam {r.pontos - membro.pontos} pontos
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Meus resgates */}
        {resgates.length > 0 && (
          <section>
            <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--ink)" }}>
              Meus resgates
              {pendentes > 0 && (
                <span className="ml-2 text-xs font-normal rounded-full px-2 py-0.5"
                  style={{ background: "rgba(255,200,0,0.12)", color: "#f5a623" }}>
                  {pendentes} pendente{pendentes !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
            <div className="space-y-2">
              {resgates.map((r) => (
                <div key={r.id} className="rounded-xl border p-4"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{r.recompensa}</p>
                      <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                        {new Date(r.created_at).toLocaleDateString("pt-BR")} · {r.pontos_custo} pts
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.status === "aprovado" && r.codigo && (
                    <div className="mt-2 rounded-lg px-3 py-2 text-sm font-mono font-bold text-center"
                      style={{ background: "rgba(0,230,118,0.10)", color: "var(--gain)" }}>
                      {r.codigo}
                    </div>
                  )}
                  {r.status === "pendente" && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                      Aguardando aprovação da e-Drive Go. Você será notificado em breve.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Histórico de pontos */}
        {!loadingData && transacoes.length > 0 && (
          <section>
            <button
              onClick={() => setShowHistorico((v) => !v)}
              className="flex w-full items-center justify-between py-2"
            >
              <h2 className="font-display text-base font-bold" style={{ color: "var(--ink)" }}>
                Histórico de pontos
              </h2>
              {showHistorico
                ? <ChevronUp className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />
                : <ChevronDown className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />}
            </button>

            {showHistorico && (
              <div className="rounded-xl border overflow-hidden mt-2"
                style={{ borderColor: "var(--card-border)" }}>
                {transacoes.map((t, i) => (
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
          </section>
        )}
      </div>
    </ClubeShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pendente") return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: "rgba(255,200,0,0.12)", color: "#f5a623" }}>
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
