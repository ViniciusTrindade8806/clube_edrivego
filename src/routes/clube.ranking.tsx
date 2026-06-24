import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClubeShell } from "@/components/clube/ClubeShell";
import { TierBadge } from "@/components/clube/TierBadge";
import {
  getOrCreateMembro,
  type Membro,
  type Tier,
  tierProgress,
  TIER_CONFIG,
  TIER_GLOW,
} from "@/lib/clube";
import { supabase } from "@/lib/supabase";
import { Crown, Medal, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/clube/ranking")({
  component: ProtectedRanking,
});

type RankEntry = {
  id: string;
  nome: string;
  tier_id: Tier;
  pontos: number;
  meses_contrato: number;
  avatar_url: string | null;
};

function ProtectedRanking() {
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
  return <Ranking membro={membro!} />;
}

function Ranking({ membro }: { membro: Membro }) {
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loadingRank, setLoadingRank] = useState(true);
  const { tier } = tierProgress(membro.meses_contrato);

  async function fetchRanking() {
    setLoadingRank(true);
    const { data } = await supabase
      .from("membros")
      .select("id, nome, tier_id, pontos, meses_contrato, avatar_url")
      .order("pontos", { ascending: false })
      .order("meses_contrato", { ascending: false })
      .limit(50);
    setRanking((data ?? []) as RankEntry[]);
    setLoadingRank(false);
  }

  useEffect(() => { fetchRanking(); }, []);

  const myPos = ranking.findIndex((r) => r.id === membro.id) + 1;
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3, 20);

  return (
    <ClubeShell tier={tier}>
      <div className="mx-auto max-w-lg px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--ink)" }}>
              <Crown className="h-5 w-5" style={{ color: "#C9A227" }} />
              Ranking do Clube
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
              Top motoristas por pontos acumulados
            </p>
          </div>
          <button onClick={fetchRanking} className="p-2 rounded-lg" style={{ color: "var(--ink-muted)" }}>
            <RefreshCw className={`h-4 w-4 ${loadingRank ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Sua posição */}
        {myPos > 0 && !loadingRank && (
          <div className="rounded-xl border p-4 flex items-center gap-4"
            style={{ borderColor: "rgba(201,162,39,0.30)", background: "rgba(201,162,39,0.06)" }}>
            <div className="font-display text-3xl font-extrabold w-12 text-center shrink-0"
              style={{ color: "#C9A227" }}>
              {myPos}º
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>Sua posição atual</p>
              <p className="font-semibold truncate" style={{ color: "var(--ink)" }}>{membro.nome}</p>
              <div className="mt-1"><TierBadge tier={tier} size="sm" glow /></div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-2xl font-extrabold" style={{ color: "var(--gain)" }}>
                {membro.pontos}
              </p>
              <p className="text-[10px]" style={{ color: "var(--ink-muted)" }}>pontos</p>
            </div>
          </div>
        )}

        {loadingRank ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--ink-muted)" }} />
          </div>
        ) : ranking.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Ranking em construção</p>
            <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
              Acumule pontos para aparecer aqui
            </p>
          </div>
        ) : (
          <>
            {/* Pódio top 3 */}
            {top3.length >= 3 && (
              <div className="rounded-xl border p-5"
                style={{ borderColor: "rgba(201,162,39,0.20)", background: "rgba(201,162,39,0.04)" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-center mb-4"
                  style={{ color: "#C9A227" }}>
                  🏆 Pódio
                </p>
                <div className="flex items-end justify-center gap-3">
                  {/* 2º */}
                  <PodiumCard entry={top3[1]} position={2} isMe={top3[1].id === membro.id} height="h-16" />
                  {/* 1º */}
                  <PodiumCard entry={top3[0]} position={1} isMe={top3[0].id === membro.id} height="h-24" />
                  {/* 3º */}
                  <PodiumCard entry={top3[2]} position={3} isMe={top3[2].id === membro.id} height="h-12" />
                </div>
              </div>
            )}

            {/* Lista a partir do 4º */}
            {rest.length > 0 && (
              <div className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--card-border)" }}>
                {rest.map((entry, i) => {
                  const pos = i + 4;
                  const isMe = entry.id === membro.id;
                  const cfg = TIER_CONFIG[entry.tier_id];
                  return (
                    <div key={entry.id}
                      className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                      style={{
                        borderColor: "var(--hairline)",
                        background: isMe ? "rgba(201,162,39,0.05)" : "transparent",
                      }}>
                      <span className="w-6 text-center text-xs font-bold shrink-0"
                        style={{ color: "var(--ink-muted)" }}>
                        {pos}º
                      </span>
                      <Avatar entry={entry} isMe={isMe} size={9} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate"
                          style={{ color: "var(--ink)", fontWeight: isMe ? 700 : 500 }}>
                          {isMe ? `${entry.nome.split(" ")[0]} (você)` : entry.nome.split(" ")[0]}
                        </p>
                        <TierBadge tier={entry.tier_id} size="sm" />
                      </div>
                      <p className="font-bold text-sm shrink-0"
                        style={{ color: isMe ? "var(--gain)" : "var(--ink)" }}>
                        {entry.pontos} <span className="text-[10px] font-normal" style={{ color: "var(--ink-muted)" }}>pts</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-center text-xs pb-2" style={{ color: "var(--ink-muted)" }}>
              Mostrando top {Math.min(ranking.length, 20)} motoristas
            </p>
          </>
        )}
      </div>
    </ClubeShell>
  );
}

function PodiumCard({
  entry, position, isMe, height,
}: {
  entry: RankEntry; position: number; isMe: boolean; height: string;
}) {
  const cfg = TIER_CONFIG[entry.tier_id];
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <span className="text-2xl">{medals[position - 1]}</span>
      <Avatar entry={entry} isMe={isMe} size={12} />
      <div className="text-center">
        <p className="text-xs font-bold truncate max-w-[72px]"
          style={{ color: isMe ? "var(--gain)" : "var(--ink)" }}>
          {entry.nome.split(" ")[0]}
        </p>
        <p className="text-[10px] font-bold" style={{ color: "var(--gain)" }}>
          {entry.pontos} pts
        </p>
      </div>
      {/* Barra do pódio */}
      <div className={`w-full rounded-t-lg ${height}`}
        style={{ background: cfg.color, opacity: 0.25 }} />
    </div>
  );
}

function Avatar({ entry, isMe, size }: { entry: RankEntry; isMe: boolean; size: number }) {
  const [err, setErr] = useState(false);
  const cfg = TIER_CONFIG[entry.tier_id];
  const px = `h-${size} w-${size}`;
  return (
    <div className={`${px} rounded-full overflow-hidden shrink-0`}
      style={{
        border: `2px solid ${cfg.color}`,
        boxShadow: isMe ? TIER_GLOW[entry.tier_id] : undefined,
      }}>
      {entry.avatar_url && !err ? (
        <img src={entry.avatar_url} className="h-full w-full object-cover" onError={() => setErr(true)} />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-xs font-bold"
          style={{ background: cfg.bg, color: cfg.color }}>
          {entry.nome.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
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
