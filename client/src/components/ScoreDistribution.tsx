import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Property } from "@/lib/types";
import { useMemo } from "react";

interface ScoreDistributionProps {
  properties: Property[];
}

export default function ScoreDistribution({ properties }: ScoreDistributionProps) {
  const data = useMemo(() => {
    const buckets: { range: string; count: number; color: string }[] = [
      { range: "0-9", count: 0, color: "oklch(0.50 0.15 155)" },
      { range: "10-19", count: 0, color: "oklch(0.50 0.15 155)" },
      { range: "20-29", count: 0, color: "oklch(0.50 0.15 155)" },
      { range: "30-39", count: 0, color: "oklch(0.55 0.15 240)" },
      { range: "40-49", count: 0, color: "oklch(0.55 0.15 240)" },
      { range: "50-59", count: 0, color: "oklch(0.65 0.17 60)" },
      { range: "60-69", count: 0, color: "oklch(0.65 0.17 60)" },
      { range: "70-79", count: 0, color: "oklch(0.50 0.20 25)" },
      { range: "80-89", count: 0, color: "oklch(0.50 0.20 25)" },
      { range: "90-100", count: 0, color: "oklch(0.50 0.20 25)" },
    ];

    properties.forEach((p) => {
      const idx = Math.min(Math.floor(p.total_priority_score / 10), 9);
      buckets[idx].count++;
    });

    return buckets;
  }, [properties]);

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <h3 className="font-[Space_Grotesk] font-semibold text-sm text-foreground mb-4">
        Priority Score Distribution
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid oklch(0.90 0.01 250)",
              }}
            />
            <Bar dataKey="count" name="Properties" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
