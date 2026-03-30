import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: string;
  sub?: string;
}

export default function MetricCard({ label, value, icon, accent, sub }: MetricCardProps) {
  return (
    <div className="bg-white border border-border rounded-sm p-4 flex items-start gap-3 shadow-sm">
      <div
        className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent || "oklch(0.94 0.01 250)" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
          {label}
        </p>
        <p className="text-2xl font-bold font-[Space_Grotesk] text-foreground leading-tight mt-0.5">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}
