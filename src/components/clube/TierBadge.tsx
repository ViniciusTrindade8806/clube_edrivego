import { TIER_CONFIG, type Tier } from "@/lib/clube";

interface TierBadgeProps {
  tier: Tier;
  size?: "sm" | "md" | "lg";
}

export function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  const cfg = TIER_CONFIG[tier];
  const cls = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${cls}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, background: cfg.color }} />
      {cfg.label}
    </span>
  );
}
