import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/clube/login")({
  component: ClubeLogin,
});

type Mode = "login" | "cadastro";

function ClubeLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se já autenticado (auto-login)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/clube/dashboard" });
      else setChecking(false);
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (err) {
        setError("E-mail ou senha incorretos. Verifique e tente novamente.");
        setLoading(false);
        return;
      }
    } else {
      if (nome.trim().length < 2) {
        setError("Informe seu nome completo.");
        setLoading(false);
        return;
      }
      const { error: err } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome: nome.trim() } },
      });
      if (err) {
        setError(err.message.includes("already registered")
          ? "Este e-mail já tem uma conta. Faça login."
          : "Erro ao criar conta. Verifique os dados e tente novamente.");
        setLoading(false);
        return;
      }
    }

    navigate({ to: "/clube/dashboard" });
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "cadastro" : "login"));
    setError(null);
    setSenha("");
  }

  if (checking) return <FullLoader />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/clube" className="mb-6">
            <Logo />
          </Link>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-muted)]"
            style={{ borderColor: "rgba(255,255,255,0.10)" }}>
            Clube de Benefícios
          </span>
          <h1 className="font-display text-2xl font-bold">
            {mode === "login" ? "Entrar na sua conta" : "Criar sua conta"}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            {mode === "login"
              ? "Você ficará conectado automaticamente nas próximas visitas."
              : "Crie sua conta e acesse todos os benefícios."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === "cadastro" && (
            <FormField
              label="Nome completo"
              type="text"
              value={nome}
              onChange={setNome}
              placeholder="João Silva"
              autoComplete="name"
            />
          )}

          <FormField
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            autoComplete="email"
          />

          <div className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
              Senha
            </span>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={mode === "cadastro" ? "Mínimo 6 caracteres" : "••••••••"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                className="w-full rounded-lg border bg-white/[0.04] px-4 py-4 pr-12 text-base text-white placeholder:text-[color:var(--ink-muted)]/50 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
                style={{ borderColor: "rgba(255,255,255,0.10)" }}
              />
              <button
                type="button"
                onClick={() => setShowSenha((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--ink-muted)] hover:text-white transition-colors"
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-[color:var(--loss)]/20 bg-[color:var(--loss)]/[0.06] px-4 py-3 text-sm text-[color:var(--loss)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[color:var(--gain)] px-6 py-4 text-base font-semibold text-[#062b14] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? mode === "login" ? "Entrando..." : "Criando conta..."
              : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        {/* Switch mode */}
        <p className="mt-6 text-center text-sm text-[color:var(--ink-muted)]">
          {mode === "login" ? "Não tem conta ainda?" : "Já tem uma conta?"}{" "}
          <button
            onClick={switchMode}
            className="font-semibold text-white underline underline-offset-4 hover:opacity-70"
          >
            {mode === "login" ? "Criar conta" : "Fazer login"}
          </button>
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            to="/clube"
            className="flex items-center gap-1.5 text-xs text-[color:var(--ink-muted)] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o clube
          </Link>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
        {label}
      </span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-lg border bg-white/[0.04] px-4 py-4 text-base text-white placeholder:text-[color:var(--ink-muted)]/50 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
        style={{ borderColor: "rgba(255,255,255,0.10)" }}
      />
    </label>
  );
}

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[color:var(--gain)]" />
    </div>
  );
}
