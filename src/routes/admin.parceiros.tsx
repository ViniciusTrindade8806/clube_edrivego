import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { TIER_CONFIG, type Tier } from "@/lib/clube";
import {
  CAT_PARCEIRO,
  getTodosParceirosAdmin,
  type CatParceiro,
  type Parceiro,
  type BeneficioParceiro,
  type ParceiroComBeneficios,
} from "@/lib/parceiros";
import {
  Plus, ChevronDown, ChevronRight, Trash2,
  RefreshCw, Tag, ToggleLeft, ToggleRight, Check,
} from "lucide-react";

export const Route = createFileRoute("/admin/parceiros")({
  component: AdminParceiros,
});

type PForm = {
  nome: string; categoria: CatParceiro;
  logo_emoji: string; descricao: string; cidade: string;
};
type BForm = {
  titulo: string; descricao: string; desconto_pct: string;
  cupom: string; tier_minimo: Tier; validade: string;
};

const EMPTY_P: PForm = { nome: "", categoria: "outros", logo_emoji: "🏪", descricao: "", cidade: "Salvador, BA" };
const EMPTY_B: BForm = { titulo: "", descricao: "", desconto_pct: "", cupom: "", tier_minimo: "bronze", validade: "" };

function AdminParceiros() {
  const [parceiros, setParceiros] = useState<ParceiroComBeneficios[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddP, setShowAddP] = useState(false);
  const [pForm, setPForm] = useState<PForm>(EMPTY_P);
  const [addingBFor, setAddingBFor] = useState<string | null>(null);
  const [bForms, setBForms] = useState<Record<string, BForm>>({});

  const fetch = useCallback(async () => {
    setLoading(true);
    setParceiros(await getTodosParceirosAdmin());
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function saveParceiro() {
    if (!pForm.nome.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("parceiros").insert({
      nome: pForm.nome.trim(),
      categoria: pForm.categoria,
      logo_emoji: pForm.logo_emoji || "🏪",
      descricao: pForm.descricao.trim() || null,
      cidade: pForm.cidade.trim() || "Salvador, BA",
    }).select().single();
    if (data) {
      setParceiros((prev) => [{ ...(data as Parceiro), beneficios_parceiros: [] }, ...prev]);
      setPForm(EMPTY_P);
      setShowAddP(false);
    }
    setSaving(false);
  }

  async function toggleParceiro(id: string, ativo: boolean) {
    await supabase.from("parceiros").update({ ativo: !ativo }).eq("id", id);
    setParceiros((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !ativo } : p)));
  }

  async function deleteParceiro(id: string) {
    if (!confirm("Deletar este parceiro e todos os seus benefícios?")) return;
    await supabase.from("parceiros").delete().eq("id", id);
    setParceiros((prev) => prev.filter((p) => p.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function saveBeneficio(parceiroId: string) {
    const bf = bForms[parceiroId] ?? EMPTY_B;
    if (!bf.titulo.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("beneficios_parceiros").insert({
      parceiro_id: parceiroId,
      titulo: bf.titulo.trim(),
      descricao: bf.descricao.trim() || null,
      desconto_pct: bf.desconto_pct ? Number(bf.desconto_pct) : null,
      cupom: bf.cupom.trim().toUpperCase() || null,
      tier_minimo: bf.tier_minimo,
      validade: bf.validade || null,
    }).select().single();
    if (data) {
      setParceiros((prev) =>
        prev.map((p) =>
          p.id === parceiroId
            ? { ...p, beneficios_parceiros: [...p.beneficios_parceiros, data as BeneficioParceiro] }
            : p
        )
      );
      setAddingBFor(null);
      setBForms((prev) => ({ ...prev, [parceiroId]: EMPTY_B }));
    }
    setSaving(false);
  }

  async function toggleBeneficio(parceiroId: string, bId: string, ativo: boolean) {
    await supabase.from("beneficios_parceiros").update({ ativo: !ativo }).eq("id", bId);
    setParceiros((prev) =>
      prev.map((p) =>
        p.id === parceiroId
          ? { ...p, beneficios_parceiros: p.beneficios_parceiros.map((b) => (b.id === bId ? { ...b, ativo: !ativo } : b)) }
          : p
      )
    );
  }

  async function deleteBeneficio(parceiroId: string, bId: string) {
    await supabase.from("beneficios_parceiros").delete().eq("id", bId);
    setParceiros((prev) =>
      prev.map((p) =>
        p.id === parceiroId
          ? { ...p, beneficios_parceiros: p.beneficios_parceiros.filter((b) => b.id !== bId) }
          : p
      )
    );
  }

  const bOf = (id: string): BForm => bForms[id] ?? EMPTY_B;
  const setBOf = (id: string, v: Partial<BForm>) =>
    setBForms((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_B), ...v } }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--ink-muted)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          Parceiros{" "}
          <span className="text-sm font-normal" style={{ color: "var(--ink-muted)" }}>
            ({parceiros.length})
          </span>
        </h1>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 rounded-lg" style={{ color: "var(--ink-muted)" }}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowAddP((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: showAddP ? "var(--card-bg)" : "rgba(0,230,118,0.12)", color: showAddP ? "var(--ink-muted)" : "var(--gain)" }}
          >
            <Plus className="h-4 w-4" />
            Novo parceiro
          </button>
        </div>
      </div>

      {/* Formulário: novo parceiro */}
      {showAddP && (
        <div className="rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "rgba(0,230,118,0.20)", background: "rgba(0,230,118,0.04)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gain)" }}>Novo parceiro</p>
          <div className="grid grid-cols-[3rem_1fr] gap-2">
            <Field label="Emoji">
              <input value={pForm.logo_emoji} onChange={(e) => setPForm((v) => ({ ...v, logo_emoji: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2.5 text-center text-lg outline-none"
                style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
            </Field>
            <Field label="Nome do parceiro">
              <input value={pForm.nome} onChange={(e) => setPForm((v) => ({ ...v, nome: e.target.value }))}
                placeholder="Ex: Farmácia Dose Certa"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Categoria">
              <select value={pForm.categoria} onChange={(e) => setPForm((v) => ({ ...v, categoria: e.target.value as CatParceiro }))}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }}>
                {(Object.entries(CAT_PARCEIRO) as [CatParceiro, { label: string }][]).map(([k, c]) => (
                  <option key={k} value={k}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Cidade">
              <input value={pForm.cidade} onChange={(e) => setPForm((v) => ({ ...v, cidade: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
            </Field>
          </div>
          <Field label="Descrição (opcional)">
            <input value={pForm.descricao} onChange={(e) => setPForm((v) => ({ ...v, descricao: e.target.value }))}
              placeholder="Descreva o parceiro brevemente"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
          </Field>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddP(false)}
              className="rounded-lg px-4 py-2 text-sm transition-colors" style={{ color: "var(--ink-muted)" }}>
              Cancelar
            </button>
            <button onClick={saveParceiro} disabled={saving || !pForm.nome.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--gain)", color: "#062b14" }}>
              {saving ? "Salvando…" : "Salvar parceiro"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de parceiros */}
      <div className="space-y-3">
        {parceiros.map((p) => {
          const cat = CAT_PARCEIRO[p.categoria];
          const isExp = expanded === p.id;
          const ativos = p.beneficios_parceiros.filter((b) => b.ativo).length;

          return (
            <div key={p.id} className="rounded-xl border overflow-hidden"
              style={{ borderColor: p.ativo ? "var(--card-border)" : "var(--card-border-dim)", background: "var(--card-bg)" }}>
              {/* Header do parceiro */}
              <div className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 shrink-0 rounded-lg border flex items-center justify-center text-xl"
                  style={{ borderColor: "var(--card-border)" }}>
                  {p.logo_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: p.ativo ? "var(--ink)" : "var(--ink-muted)" }}>{p.nome}</p>
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    {cat.icon} {cat.label} · {p.cidade} · {ativos} benefício{ativos !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleParceiro(p.id, p.ativo)} title={p.ativo ? "Desativar" : "Ativar"}
                    style={{ color: p.ativo ? "var(--gain)" : "var(--ink-muted)" }}>
                    {p.ativo ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                  <button onClick={() => deleteParceiro(p.id)} title="Deletar"
                    className="p-1.5 rounded transition-colors" style={{ color: "var(--ink-muted)" }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setExpanded(isExp ? null : p.id)}
                    className="p-1.5 rounded transition-colors" style={{ color: "var(--ink-muted)" }}>
                    {isExp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Painel de benefícios */}
              {isExp && (
                <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: "var(--hairline)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
                    Benefícios / Descontos
                  </p>

                  {p.beneficios_parceiros.map((b) => {
                    const tcfg = TIER_CONFIG[b.tier_minimo];
                    return (
                      <div key={b.id} className="flex items-start gap-2 rounded-lg p-3"
                        style={{ background: b.ativo ? "var(--card-bg-dim)" : "transparent", opacity: b.ativo ? 1 : 0.5 }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{b.titulo}</p>
                          {b.descricao && <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{b.descricao}</p>}
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
                            {b.cupom && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{ background: "var(--card-bg)", color: "var(--ink)" }}>
                                <Tag className="inline h-2.5 w-2.5 mr-0.5" />{b.cupom}
                              </span>
                            )}
                            {b.validade && (
                              <span className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                                até {new Date(b.validade).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => toggleBeneficio(p.id, b.id, b.ativo)} title={b.ativo ? "Desativar" : "Ativar"}
                            style={{ color: b.ativo ? "var(--gain)" : "var(--ink-muted)" }}>
                            {b.ativo ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button onClick={() => deleteBeneficio(p.id, b.id)}
                            className="p-1 rounded" style={{ color: "var(--ink-muted)" }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Formulário: novo benefício */}
                  {addingBFor === p.id ? (
                    <div className="rounded-lg border p-3 space-y-2 mt-2"
                      style={{ borderColor: "var(--input-border)", background: "var(--input-bg)" }}>
                      <Field label="Título do benefício">
                        <input value={bOf(p.id).titulo} onChange={(e) => setBOf(p.id, { titulo: e.target.value })}
                          placeholder="Ex: 15% de desconto em medicamentos"
                          className="w-full rounded border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
                      </Field>
                      <Field label="Descrição (opcional)">
                        <input value={bOf(p.id).descricao} onChange={(e) => setBOf(p.id, { descricao: e.target.value })}
                          className="w-full rounded border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Desconto (%)">
                          <input type="number" min={0} max={100} value={bOf(p.id).desconto_pct}
                            onChange={(e) => setBOf(p.id, { desconto_pct: e.target.value })}
                            placeholder="Ex: 15"
                            className="w-full rounded border px-3 py-2 text-sm outline-none"
                            style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
                        </Field>
                        <Field label="Cupom (opcional)">
                          <input value={bOf(p.id).cupom} onChange={(e) => setBOf(p.id, { cupom: e.target.value.toUpperCase() })}
                            placeholder="EDRIVEGO15"
                            className="w-full rounded border px-3 py-2 text-sm font-mono outline-none"
                            style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Tier mínimo">
                          <select value={bOf(p.id).tier_minimo} onChange={(e) => setBOf(p.id, { tier_minimo: e.target.value as Tier })}
                            className="w-full rounded border px-3 py-2 text-sm outline-none"
                            style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }}>
                            <option value="bronze">Bronze</option>
                            <option value="prata">Prata</option>
                            <option value="ouro">Ouro</option>
                          </select>
                        </Field>
                        <Field label="Validade (opcional)">
                          <input type="date" value={bOf(p.id).validade} onChange={(e) => setBOf(p.id, { validade: e.target.value })}
                            className="w-full rounded border px-3 py-2 text-sm outline-none"
                            style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--ink)" }} />
                        </Field>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setAddingBFor(null)}
                          className="rounded px-3 py-1.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                          Cancelar
                        </button>
                        <button onClick={() => saveBeneficio(p.id)} disabled={saving || !bOf(p.id).titulo.trim()}
                          className="rounded px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                          style={{ background: "var(--gain)", color: "#062b14" }}>
                          <Check className="h-3.5 w-3.5" />
                          {saving ? "Salvando…" : "Adicionar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingBFor(p.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors mt-1"
                      style={{ borderColor: "var(--card-border)", color: "var(--ink-muted)" }}>
                      <Plus className="h-3.5 w-3.5" />
                      Novo benefício
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {parceiros.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: "var(--ink-muted)" }}>
            Nenhum parceiro cadastrado. Clique em "Novo parceiro" para começar.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}
