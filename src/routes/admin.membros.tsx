import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { TIER_CONFIG, type Tier } from "@/lib/clube";
import { Edit2, Check, X, RefreshCw, AlertCircle } from "lucide-react";

type MembroAdmin = {
  id: string;
  email: string;
  nome: string;
  whatsapp: string | null;
  tier_id: Tier;
  meses_contrato: number;
  pontos: number;
  codigo_indicacao: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/membros")({
  component: AdminMembros,
});

function AdminMembros() {
  const [membros, setMembros] = useState<MembroAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMeses, setEditMeses] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchMembros = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from("membros")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setErro("Sem permissão para listar membros. Execute o SQL de políticas admin no Supabase.");
    } else {
      setMembros((data ?? []) as MembroAdmin[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembros(); }, [fetchMembros]);

  async function saveEdit(id: string) {
    setSaving(true);
    const { error } = await supabase
      .from("membros")
      .update({ meses_contrato: editMeses })
      .eq("id", id);
    if (!error) {
      await fetchMembros();
      setEditId(null);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--ink-muted)" }} />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-xl border p-5 flex gap-3" style={{ borderColor: "rgba(240,68,56,0.20)", background: "rgba(240,68,56,0.06)" }}>
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--loss)" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--loss)" }}>Erro de permissão</p>
          <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>{erro}</p>
          <p className="mt-3 text-xs font-mono rounded p-2 select-all" style={{ background: "var(--card-bg)", color: "var(--ink)" }}>
            {`-- Cole no Supabase SQL Editor:\ncreate policy "admin lê todos"\n  on public.membros for select\n  using (auth.email() = 'vini@admin.com');\n\ncreate policy "admin atualiza qualquer"\n  on public.membros for update\n  using (auth.email() = 'vini@admin.com');`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          Membros{" "}
          <span className="text-sm font-normal" style={{ color: "var(--ink-muted)" }}>
            ({membros.length})
          </span>
        </h1>
        <button
          onClick={fetchMembros}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--ink-muted)" }}
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Legenda de tiers */}
      <div className="flex gap-3 mb-4">
        {(["bronze", "prata", "ouro"] as Tier[]).map((t) => {
          const cfg = TIER_CONFIG[t];
          const count = membros.filter((m) => m.tier_id === t).length;
          return (
            <div
              key={t}
              className="flex-1 rounded-lg border p-3 text-center"
              style={{ borderColor: cfg.border, background: cfg.bg }}
            >
              <p className="text-lg font-bold" style={{ color: cfg.color }}>{count}</p>
              <p className="text-[10px] font-semibold uppercase" style={{ color: cfg.color }}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {membros.map((m) => {
          const isEditing = editId === m.id;
          const cfg = TIER_CONFIG[m.tier_id];
          const dataEntrada = new Date(m.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric",
          });

          return (
            <div
              key={m.id}
              className="rounded-xl border p-4"
              style={{
                background: "var(--card-bg)",
                borderColor: isEditing ? cfg.border : "var(--card-border)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: "var(--ink)" }}>{m.nome}</p>
                  <p className="text-xs truncate" style={{ color: "var(--ink-muted)" }}>{m.email}</p>
                  {m.whatsapp && (
                    <p className="text-xs" style={{ color: "var(--ink-muted)" }}>{m.whatsapp}</p>
                  )}
                </div>
                <span
                  className="shrink-0 px-2 py-0.5 rounded text-xs font-bold"
                  style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  {cfg.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {/* Meses — editável */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-muted)" }}>Meses</p>
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={editMeses}
                        onChange={(e) => setEditMeses(Number(e.target.value))}
                        className="w-16 rounded border px-2 py-1 text-sm outline-none"
                        style={{
                          borderColor: "var(--input-border)",
                          background: "var(--input-bg)",
                          color: "var(--ink)",
                        }}
                      />
                    ) : (
                      <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>{m.meses_contrato}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-muted)" }}>Pontos</p>
                    <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>{m.pontos}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-muted)" }}>Entrou</p>
                    <p className="text-xs" style={{ color: "var(--ink-muted)" }}>{dataEntrada}</p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(m.id)}
                        disabled={saving}
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: "rgba(0,230,118,0.10)" }}
                        aria-label="Salvar"
                      >
                        <Check className="h-4 w-4" style={{ color: "var(--gain)" }} />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: "var(--card-bg)" }}
                        aria-label="Cancelar"
                      >
                        <X className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setEditId(m.id); setEditMeses(m.meses_contrato); }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: "var(--card-bg)" }}
                      aria-label="Editar meses"
                    >
                      <Edit2 className="h-4 w-4" style={{ color: "var(--ink-muted)" }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {membros.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: "var(--ink-muted)" }}>
            Nenhum membro cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
