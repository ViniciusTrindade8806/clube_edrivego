import { supabase } from "./supabase";
import type { Tier } from "./clube";

export type CatParceiro =
  | "saude" | "alimentacao" | "auto"
  | "financeiro" | "educacao" | "lazer" | "outros";

export const CAT_PARCEIRO: Record<CatParceiro, { label: string; icon: string }> = {
  saude:       { label: "Saúde",       icon: "🏥" },
  alimentacao: { label: "Alimentação", icon: "🍽️" },
  auto:        { label: "Automóvel",   icon: "🚗" },
  financeiro:  { label: "Financeiro",  icon: "💳" },
  educacao:    { label: "Educação",    icon: "📚" },
  lazer:       { label: "Lazer",       icon: "🎭" },
  outros:      { label: "Outros",      icon: "✦" },
};

export type Parceiro = {
  id: string;
  nome: string;
  categoria: CatParceiro;
  descricao: string | null;
  logo_emoji: string;
  cidade: string;
  ativo: boolean;
  created_at: string;
};

export type BeneficioParceiro = {
  id: string;
  parceiro_id: string;
  titulo: string;
  descricao: string | null;
  desconto_pct: number | null;
  cupom: string | null;
  tier_minimo: Tier;
  ativo: boolean;
  validade: string | null;
  created_at: string;
};

export type ParceiroComBeneficios = Parceiro & {
  beneficios_parceiros: BeneficioParceiro[];
};

export async function getParceirosAtivos(): Promise<ParceiroComBeneficios[]> {
  const { data } = await supabase
    .from("parceiros")
    .select("*, beneficios_parceiros(*)")
    .eq("ativo", true)
    .order("nome");
  return ((data ?? []) as ParceiroComBeneficios[]).map((p) => ({
    ...p,
    beneficios_parceiros: p.beneficios_parceiros.filter((b) => b.ativo),
  }));
}

export async function getTodosParceirosAdmin(): Promise<ParceiroComBeneficios[]> {
  const { data } = await supabase
    .from("parceiros")
    .select("*, beneficios_parceiros(*)")
    .order("created_at", { ascending: false });
  return (data ?? []) as ParceiroComBeneficios[];
}
