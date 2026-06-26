interface ScoreBarProps {
  score: number;
  max?: number;
  tier: string;
}

const tierColors: Record<string, string> = {
  Critical: "oklch(0.50 0.20 25)",
  High: "oklch(0.60 0.17 60)",
  Medium: "oklch(0.55 0.15 240)",
  Low: "oklch(0.45 0.15 155)",
};

export default function ScoreBar({ score, max = 100, tier }: ScoreBarProps) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold w-5 text-right tabular-nums">{score}</span>
      <div className="score-bar flex-1 min-w-[2rem]">
        <div
          className="score-fill"
          style={{
            width: `${pct}%`,
            backgroundColor: tierColors[tier] || tierColors.Low,
          }}
        />
      </div>
    </div>
  );
}
