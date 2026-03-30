interface TierBadgeProps {
  tier: "Critical" | "High" | "Medium" | "Low";
  size?: "sm" | "md";
}

const tierStyles: Record<string, string> = {
  Critical: "bg-[oklch(0.50_0.20_25)] text-white",
  High: "bg-[oklch(0.65_0.17_60)] text-[oklch(0.20_0.10_60)]",
  Medium: "bg-[oklch(0.55_0.15_240)] text-white",
  Low: "bg-[oklch(0.50_0.15_155)] text-white",
};

export default function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-sm ${sizeClass} ${tierStyles[tier]}`}
    >
      {tier}
    </span>
  );
}
