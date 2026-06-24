import { supabase } from "@/lib/supabase";

export type Tier = "bronze" | "prata" | "ouro";

export interface Membro {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string;
  tier_id: Tier;
  meses_contrato: number;
  pontos: number;
  codigo_indicacao: string;
  avatar_url?: string | null;
  created_at: string;
}

export const TIER_GLOW: Record<Tier, string> = {
  bronze: "0 0 8px rgba(205,127,50,0.30), 0 0 18px rgba(205,127,50,0.12)",
  prata:  "0 0 12px rgba(142,142,147,0.45), 0 0 28px rgba(142,142,147,0.20)",
  ouro:   "0 0 18px rgba(201,162,39,0.60), 0 0 36px rgba(201,162,39,0.28), 0 0 60px rgba(201,162,39,0.12)",
};

export interface BeneficioStatic {
  id: string;
  categoria_id: string;
  titulo: string;
  descricao: string;
  tier_minimo: Tier;
  tipo: "desconto" | "cashback" | "acesso" | "voucher" | "upgrade";
  valor: string;
  em_breve: boolean;
}

export interface Categoria {
  id: string;
  label: string;
  icon: string;
}

export const CATEGORIAS: Categoria[] = [
  { id: "todas", label: "Todas", icon: "✦" },
  { id: "saude", label: "Saúde", icon: "❤️" },
  { id: "financeiro", label: "Financeiro", icon: "💰" },
  { id: "alimentacao", label: "Alimentação", icon: "🍽️" },
  { id: "carro", label: "Carro", icon: "🚗" },
  { id: "comunidade", label: "Comunidade", icon: "⭐" },
];

export const TIER_CONFIG = {
  bronze: {
    label: "Bronze",
    color: "#CD7F32",
    bg: "rgba(205,127,50,0.12)",
    border: "rgba(205,127,50,0.30)",
    min_meses: 0,
    next: "prata" as Tier | null,
    next_meses: 4,
  },
  prata: {
    label: "Prata",
    color: "#8E8E93",
    bg: "rgba(142,142,147,0.12)",
    border: "rgba(142,142,147,0.30)",
    min_meses: 4,
    next: "ouro" as Tier | null,
    next_meses: 12,
  },
  ouro: {
    label: "Ouro",
    color: "#C9A227",
    bg: "rgba(201,162,39,0.12)",
    border: "rgba(201,162,39,0.30)",
    min_meses: 12,
    next: null,
    next_meses: null,
  },
} as const;

export const TIER_ORDER: Tier[] = ["bronze", "prata", "ouro"];

export function getTierFromMeses(meses: number): Tier {
  if (meses >= 12) return "ouro";
  if (meses >= 4) return "prata";
  return "bronze";
}

export function tierProgress(meses: number): {
  tier: Tier;
  progress: number;
  mesesParaProximo: number;
} {
  if (meses >= 12) return { tier: "ouro", progress: 100, mesesParaProximo: 0 };
  if (meses >= 4)
    return {
      tier: "prata",
      progress: ((meses - 4) / 8) * 100,
      mesesParaProximo: 12 - meses,
    };
  return {
    tier: "bronze",
    progress: (meses / 4) * 100,
    mesesParaProximo: 4 - meses,
  };
}

export function canAccess(memberTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(memberTier) >= TIER_ORDER.indexOf(requiredTier);
}

export const BENEFICIOS: BeneficioStatic[] = [
  // Saúde & Bem-estar
  {
    id: "saude-1",
    categoria_id: "saude",
    titulo: "Telemedicina",
    descricao: "Consultas médicas online sem tirar o carro de operação",
    tier_minimo: "bronze",
    tipo: "acesso",
    valor: "Grátis",
    em_breve: true,
  },
  {
    id: "saude-2",
    categoria_id: "saude",
    titulo: "Farmácias parceiras",
    descricao: "Desconto em medicamentos nas farmácias conveniadas",
    tier_minimo: "bronze",
    tipo: "desconto",
    valor: "15% off",
    em_breve: true,
  },
  {
    id: "saude-3",
    categoria_id: "saude",
    titulo: "Plano odontológico",
    descricao: "Acesso a plano odontológico básico com consultas e limpezas",
    tier_minimo: "prata",
    tipo: "acesso",
    valor: "Incluso",
    em_breve: true,
  },
  {
    id: "saude-4",
    categoria_id: "saude",
    titulo: "Academia parceira",
    descricao: "Desconto em academias e espaços de lazer conveniados",
    tier_minimo: "prata",
    tipo: "desconto",
    valor: "30% off",
    em_breve: true,
  },
  // Financeiro
  {
    id: "fin-1",
    categoria_id: "financeiro",
    titulo: "Cashback na recarga",
    descricao:
      "Cashback em recargas na e-Drive Energy para os motoristas mais ativos",
    tier_minimo: "ouro",
    tipo: "cashback",
    valor: "5%",
    em_breve: true,
  },
  {
    id: "fin-2",
    categoria_id: "financeiro",
    titulo: "Desconto progressivo",
    descricao: "Redução crescente no valor do plano por tempo de permanência",
    tier_minimo: "prata",
    tipo: "desconto",
    valor: "Até 10%",
    em_breve: false,
  },
  {
    id: "fin-3",
    categoria_id: "financeiro",
    titulo: "Crédito preferencial",
    descricao:
      "Condições especiais de crédito baseadas no histórico com a e-Drive Go",
    tier_minimo: "prata",
    tipo: "acesso",
    valor: "Taxa reduzida",
    em_breve: true,
  },
  {
    id: "fin-4",
    categoria_id: "financeiro",
    titulo: "Seguro de renda",
    descricao:
      "Proteção de renda em caso de afastamento por doença ou acidente",
    tier_minimo: "bronze",
    tipo: "acesso",
    valor: "A partir de R$ 15",
    em_breve: true,
  },
  // Alimentação & Rotina
  {
    id: "ali-1",
    categoria_id: "alimentacao",
    titulo: "Restaurantes nos eletropostos",
    descricao:
      "Descontos em restaurantes e lanchonetes próximos aos pontos de recarga",
    tier_minimo: "bronze",
    tipo: "desconto",
    valor: "10–20%",
    em_breve: true,
  },
  {
    id: "ali-2",
    categoria_id: "alimentacao",
    titulo: "Plataformas de delivery",
    descricao: "Desconto em pedidos nas principais plataformas de delivery",
    tier_minimo: "bronze",
    tipo: "desconto",
    valor: "R$ 10 off",
    em_breve: true,
  },
  {
    id: "ali-3",
    categoria_id: "alimentacao",
    titulo: "Voucher de alimentação",
    descricao:
      "Crédito mensal de alimentação — o benefício que o CLT tem e o autônomo também merece",
    tier_minimo: "prata",
    tipo: "voucher",
    valor: "R$ 150/mês",
    em_breve: true,
  },
  // Carro & Trabalho
  {
    id: "car-1",
    categoria_id: "carro",
    titulo: "Upgrade de modelo",
    descricao:
      "Após 12 meses de contrato, upgrade para um modelo superior sem custo adicional",
    tier_minimo: "ouro",
    tipo: "upgrade",
    valor: "Grátis",
    em_breve: false,
  },
  {
    id: "car-2",
    categoria_id: "carro",
    titulo: "Kit de acessórios",
    descricao:
      "Suporte de celular, organizador de porta-malas e tapete personalizado e-Drive Go",
    tier_minimo: "prata",
    tipo: "acesso",
    valor: "Kit incluso",
    em_breve: false,
  },
  {
    id: "car-3",
    categoria_id: "carro",
    titulo: "Suporte prioritário",
    descricao:
      "Atendimento dedicado e substituição prioritária para motoristas com mais tempo de casa",
    tier_minimo: "ouro",
    tipo: "acesso",
    valor: "Prioritário",
    em_breve: false,
  },
  // Reconhecimento & Comunidade
  {
    id: "com-1",
    categoria_id: "comunidade",
    titulo: "Programa de indicação",
    descricao:
      "Ganhe 500 pontos por cada novo motorista aprovado que você indicar",
    tier_minimo: "bronze",
    tipo: "cashback",
    valor: "500 pts",
    em_breve: false,
  },
  {
    id: "com-2",
    categoria_id: "comunidade",
    titulo: "Motorista do Mês",
    descricao:
      "Reconhecimento mensal com benefício exclusivo para o motorista destaque",
    tier_minimo: "bronze",
    tipo: "acesso",
    valor: "Prêmio especial",
    em_breve: false,
  },
  {
    id: "com-3",
    categoria_id: "comunidade",
    titulo: "Grupo exclusivo",
    descricao:
      "Acesso ao grupo de motoristas com dicas e informações estratégicas na RMS",
    tier_minimo: "bronze",
    tipo: "acesso",
    valor: "Exclusivo",
    em_breve: false,
  },
  {
    id: "com-4",
    categoria_id: "comunidade",
    titulo: "Ranking por avaliação",
    descricao:
      "Compete no ranking mensal de avaliação com premiação para os top motoristas",
    tier_minimo: "bronze",
    tipo: "acesso",
    valor: "Premiação",
    em_breve: false,
  },
  // Prata exclusivos
  {
    id: "pra-1",
    categoria_id: "comunidade",
    titulo: "Bônus de fidelidade",
    descricao: "100 pontos extras por mês completo de contrato ativo — o prêmio de quem ficou",
    tier_minimo: "prata",
    tipo: "cashback",
    valor: "+100 pts/mês",
    em_breve: false,
  },
  {
    id: "pra-2",
    categoria_id: "carro",
    titulo: "Desconto em recarga",
    descricao: "10% de desconto nas recargas nos eletropostos e-Drive Energy conveniados",
    tier_minimo: "prata",
    tipo: "desconto",
    valor: "10% off",
    em_breve: false,
  },
  {
    id: "pra-3",
    categoria_id: "financeiro",
    titulo: "Proteção jurídica",
    descricao: "Consultoria jurídica para multas, acidentes e questões trabalhistas do autônomo",
    tier_minimo: "prata",
    tipo: "acesso",
    valor: "Incluso",
    em_breve: true,
  },
  {
    id: "pra-4",
    categoria_id: "saude",
    titulo: "Desconto em ótica",
    descricao: "40% em armações e lentes em óticas parceiras — visão em dia para rodar mais",
    tier_minimo: "prata",
    tipo: "desconto",
    valor: "40% off",
    em_breve: false,
  },
  {
    id: "pra-5",
    categoria_id: "comunidade",
    titulo: "Badge de veterano",
    descricao: "Badge exclusivo no perfil após 6 meses — reconhecimento visível no ranking do clube",
    tier_minimo: "prata",
    tipo: "acesso",
    valor: "Exclusivo",
    em_breve: false,
  },
  // Ouro exclusivos
  {
    id: "car-4",
    categoria_id: "carro",
    titulo: "Desconto extra no plano",
    descricao:
      "15% de desconto fixo na mensalidade — para quem ficou e provou lealdade",
    tier_minimo: "ouro",
    tipo: "desconto",
    valor: "15% off",
    em_breve: false,
  },
  {
    id: "car-5",
    categoria_id: "carro",
    titulo: "Lavagem mensal grátis",
    descricao:
      "Uma lavagem completa por mês nos parceiros de auto-detailing do clube",
    tier_minimo: "ouro",
    tipo: "voucher",
    valor: "1×/mês",
    em_breve: false,
  },
  {
    id: "com-5",
    categoria_id: "comunidade",
    titulo: "Suporte VIP direto",
    descricao:
      "Atendimento exclusivo via WhatsApp com tempo de resposta garantido em 2 horas",
    tier_minimo: "ouro",
    tipo: "acesso",
    valor: "VIP",
    em_breve: false,
  },
];

export async function getOrCreateMembro(): Promise<Membro | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("membros")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existing) return existing as Membro;

  const nome =
    (user.user_metadata?.nome as string | undefined) ??
    user.email?.split("@")[0] ??
    "Motorista";

  const { data: created } = await supabase
    .from("membros")
    .insert({ id: user.id, email: user.email, nome })
    .select()
    .single();

  return (created as Membro) ?? null;
}
