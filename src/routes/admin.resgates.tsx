import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { getTodosResgatesAdmin, type ResgateComMembro } from "@/lib/pontos";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/resgates")({
  component: AdminResgates,
});

type Filtro = "todos" | "pendente" | "aprovado" | "rejeitado";

function AdminResgates() {
  const [resgates, setResgates] = useState<ResgateComMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const [saving, setSaving] = useState(false);
  const [codigoAprov, setCodigoAprov] = useState<Record<string, string>>({});
  const [aprovando, setAprovando] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setResgates(await getTodosResgatesAdmin());
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function aprovar(r: ResgateComMembro) {
    setSaving(true);
    const codigo = codigoAprov[r.id]?.trim() || null;
    await supabase.from("resgates").update({ status: "aprovado", codigo }).eq("id", r.id);
    setResgates((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "aprovado", codigo } : x));
    setAprovando(null);
    setSaving(false);
  }

  async function rejeitar(r: ResgateComMembro) {
    if (!confirm(`Rejeitar resgate de ${r.membros?.nome ?? r.membro_id}?\n\nLembre-se de estornar ${r.pontos_custo} pontos manualmente via Membros.`)) return;
    setSaving(true);
    await supabase.from("resgates").update({ status: "rejeitado" }).eq("id", r.id);
    setResgates((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "rejeitado" } : x));
    setSaving(false);
  }

  const filtrados = filtro === "todos" ? resgates : resgates.filter((r) => r.status === filtro);
  const pendentes = resgates.filter((r) => r.status === "pendente").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--ink-muted)" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          Resgates
          {pendentes > 0 && (
            <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: "rgba(240,68,56,0.15)", color: "var(--loss)" }}>
              {pendentes} pendente{pendentes !== 1 ? "s" : ""}
            </span>
          )}
        </h1>
        <button onClick={fetch} className="p-2 rounded-lg" style={{ color: "var(--ink-muted)" }}>
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(["pendente", "aprovado", "rejeitado", "todos"] as Filtro[]).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className="rounded-full border px-3 py-1 text-xs font-semibold transition-all capitalize"
            style={{
              borderColor: filtro === f ? "var(--gain)" : "var(--card-border)",
              background: filtro === f ? "rgba(0,230,118,0.10)" : "transparent",
              color: filtro === f ? "var(--gain)" : "var(--ink-muted)",
            }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtrados.map((r) => {
          const data = new Date(r.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric",
          });
          const isAprovando = aprovando === r.id;

          return (
            <div key={r.id} className="rounded-xl border p-4"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: "var(--ink)" }}>
                    {r.membros?.nome ?? "—"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--ink-muted)" }}>
                    {r.membros?.email ?? r.membro_id}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{r.recompensa}</p>
                <span className="text-xs font-bold rounded px-1.5 py-0.5"
                  style={{ background: "rgba(0,230,118,0.10)", color: "var(--gain)" }}>
                  {r.pontos_custo} pts
                </span>
                <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{data}</span>
              </div>

              {r.status === "aprovado" && r.codigo && (
                <div className="rounded-lg px-3 py-2 mb-3 text-sm font-mono font-bold"
                  style={{ background: "rgba(0,230,118,0.08)", color: "var(--gain)" }}>
                  Código: {r.codigo}
                </div>
              )}

              {r.status === "pendente" && (
                isAprovando ? (
                  <div className="space-y-2">
                    <input
                      value={codigoAprov[r.id] ?? ""}
                      onChange={(e) => setCodigoAprov((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Código / cupom para o membro (opcional)"
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
                    <div className="flex gap-2">
                      <button onClick={() => aprovar(r)} disabled={saving}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold disabled:opacity-50"
                        style={{ background: "rgba(0,230,118,0.15)", color: "var(--gain)" }}>
                        {saving ? "Salvando…" : "✓ Confirmar aprovação"}
                      </button>
                      <button onClick={() => setAprovando(null)}
                        className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setAprovando(r.id)}
                      className="flex-1 rounded-lg py-2 text-xs font-semibold"
                      style={{ background: "rgba(0,230,118,0.12)", color: "var(--gain)" }}>
                      Aprovar
                    </button>
                    <button onClick={() => rejeitar(r)} disabled={saving}
                      className="flex-1 rounded-lg py-2 text-xs font-semibold"
                      style={{ background: "rgba(240,68,56,0.10)", color: "var(--loss)" }}>
                      Rejeitar
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: "var(--ink-muted)" }}>
            Nenhum resgate {filtro !== "todos" ? filtro : ""}.
          </p>
        )}
      </div>
    </div>
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
