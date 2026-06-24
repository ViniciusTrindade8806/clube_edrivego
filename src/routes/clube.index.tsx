import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { TierBadge } from "@/components/clube/TierBadge";
import { TIER_CONFIG, BENEFICIOS, type Tier } from "@/lib/clube";
import { ArrowRight, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/clube/")({
  head: () => ({
    meta: [
      { title: "Clube e-Drive Go — Benefícios para Motoristas" },
      {
        name: "description",
        content:
          "Benefícios exclusivos para motoristas da e-Drive Go. Saúde, financeiro, alimentação e reconhecimento por fidelidade.",
      },
    ],
  }),
  component: ClubeLanding,
});

const TIER_ORDER: Tier[] = ["bronze", "prata", "ouro"];

const TIER_HIGHLIGHTS: Record<Tier, string[]> = {
  bronze: [
    "Telemedicina grátis",
    "Desconto em farmácias",
    "Programa de indicação",
    "Grupo exclusivo de motoristas",
    "Ranking mensal com premiação",
  ],
  prata: [
    "Tudo do Bronze +",
    "Plano odontológico",
    "Desconto progressivo no plano",
    "Voucher de alimentação",
    "Kit de acessórios",
  ],
  ouro: [
    "Tudo do Prata +",
    "Cashback na recarga e-Drive Energy",
    "Upgrade de modelo grátis",
    "Suporte prioritário",
    "Crédito com taxa reduzida",
  ],
};

function ClubeLanding() {
  const totalBeneficios = BENEFICIOS.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar simples */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <Link to="/" aria-label="e-Drive Go">
          <Logo />
        </Link>
        <Link
          to="/clube/login"
          className="rounded-md border px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.05]"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-muted)] mb-6"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gain)]" />
          Exclusivo para motoristas e-Drive Go
        </span>

        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Clube de Benefícios
          <br />
          <span style={{ color: "var(--gain)" }}>e-Drive Go</span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base text-[color:var(--ink-muted)]">
          {totalBeneficios} benefícios em saúde, financeiro, alimentação e
          reconhecimento. Cresce com você — quanto mais tempo, mais vantagens.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/clube/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--gain)] px-8 py-4 text-base font-semibold text-[#062b14] transition-opacity hover:opacity-90 sm:w-auto"
          >
            Acessar minha conta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Tiers */}
      <section className="mx-auto max-w-4xl px-5 pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)] mb-3">
            Sistema de tiers
          </p>
          <h2 className="font-display text-2xl font-bold">
            Quanto mais tempo, mais benefícios
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TIER_ORDER.map((tier, idx) => {
            const cfg = TIER_CONFIG[tier];
            const highlights = TIER_HIGHLIGHTS[tier];
            const isTop = tier === "ouro";

            return (
              <article
                key={tier}
                className="relative rounded-xl border p-6"
                style={{
                  borderColor: isTop ? cfg.border : "rgba(255,255,255,0.08)",
                  background: isTop ? cfg.bg : "rgba(255,255,255,0.025)",
                }}
              >
                {isTop && (
                  <div
                    className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl"
                    style={{ background: cfg.color }}
                  />
                )}
                <div className="mb-5 flex items-center justify-between">
                  <TierBadge tier={tier} size="md" />
                  <span className="text-[10px] font-medium text-[color:var(--ink-muted)]">
                    {idx === 0 ? "0–3 meses" : idx === 1 ? "4–11 meses" : "12+ meses"}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: i === 0 && tier !== "bronze" ? cfg.color : "var(--gain)" }}
                      />
                      <span
                        className={i === 0 && tier !== "bronze" ? "font-semibold text-white" : "text-[color:var(--ink-muted)]"}
                      >
                        {h}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-[color:var(--ink-muted)]">
          Já é motorista e-Drive Go?{" "}
          <Link
            to="/clube/login"
            className="font-semibold text-white underline underline-offset-4 hover:opacity-70"
          >
            Acesse sua conta
          </Link>
        </p>
      </section>
    </div>
  );
}
