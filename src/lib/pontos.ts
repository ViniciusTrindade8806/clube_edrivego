import { supabase } from "./supabase";

export type TipoPonto = "manual" | "indicacao" | "resgate" | "contrato";
export type StatusResgate = "pendente" | "aprovado" | "rejeitado";

export type PontoTransacao = {
  id: string;
  membro_id: string;
  valor: number;
  descricao: string | null;
  tipo: TipoPonto;
  created_at: string;
};

export type Resgate = {
  id: string;
  membro_id: string;
  recompensa: string;
  pontos_custo: number;
  status: StatusResgate;
  codigo: string | null;
  created_at: string;
};

export type ResgateComMembro = Resgate & {
  membros: { nome: string; email: string } | null;
};

export type Recompensa = {
  id: string;
  titulo: string;
  descricao: string;
  pontos: number;
  icone: string;
};

export const CATALOGO: Recompensa[] = [
  {
    id: "desconto_parceiro",
    titulo: "10% em parceiro",
    descricao: "Cupom de 10% de desconto em qualquer parceiro do clube",
    pontos: 300,
    icone: "🏷️",
  },
  {
    id: "lavagem",
    titulo: "1 lavagem grátis",
    descricao: "Lavagem completa em parceiro Automóvel conveniado",
    pontos: 500,
    icone: "🚿",
  },
  {
    id: "credito_20",
    titulo: "R$ 20 no aluguel",
    descricao: "Crédito de R$ 20 na próxima locação e-Drive Go",
    pontos: 1000,
    icone: "💰",
  },
  {
    id: "dia_gratis",
    titulo: "1 dia grátis",
    descricao: "Um dia completo de aluguel sem custo",
    pontos: 2000,
    icone: "🎁",
  },
];

export async function getTransacoes(membroId: string): Promise<PontoTransacao[]> {
  const { data } = await supabase
    .from("pontos_transacoes")
    .select("*")
    .eq("membro_id", membroId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as PontoTransacao[];
}

export async function getMeusResgates(membroId: string): Promise<Resgate[]> {
  const { data } = await supabase
    .from("resgates")
    .select("*")
    .eq("membro_id", membroId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Resgate[];
}

export async function getTodosResgatesAdmin(): Promise<ResgateComMembro[]> {
  const { data } = await supabase
    .from("resgates")
    .select("*, membros(nome, email)")
    .order("created_at", { ascending: false });
  return (data ?? []) as ResgateComMembro[];
}
