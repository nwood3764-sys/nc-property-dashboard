/*
 * AgeVintageChart — Horizontal bar chart showing property count by 5-year age vintage bands
 * Design: Civic Blueprint — gradient from cool (newer) to warm (older) to emphasize aging stock
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { Property } from "@/lib/types";
import { useMemo } from "react";

interface AgeVintageChartProps {
  properties: Property[];
}

// Gradient from cool blue (newer) → warm amber/red (older)
const AGE_COLORS: Record<string, string> = {
  "0-4":   "oklch(0.65 0.15 240)",
  "5-9":   "oklch(0.60 0.15 230)",
  "10-14": "oklch(0.55 0.14 220)",
  "15-19": "oklch(0.52 0.13 200)",
  "20-24": "oklch(0.50 0.12 180)",
  "25-29": "oklch(0.48 0.12 160)",
  "30-34": "oklch(0.47 0.14 130)",
  "35-39": "oklch(0.48 0.16 100)",
  "40-44": "oklch(0.50 0.17 70)",
  "45-49": "oklch(0.50 0.18 50)",
  "50-54": "oklch(0.48 0.19 35)",
  "55-59": "oklch(0.46 0.20 25)",
  "60+":   "oklch(0.42 0.20 15)",
};

export default function AgeVintageChart({ properties }: AgeVintageChartProps) {
  const { chartData, totalWithAge, avgAge, medianAge } = useMemo(() => {
    const ages = properties
      .map((p) => p.property_age_years)
      .filter((a): a is number => a != null)
      .map((a) => Math.round(a));

    const bands: Record<string, number> = {};
    for (const age of ages) {
      let label: string;
      if (age >= 60) {
        label = "60+";
      } else {
        const start = Math.floor(age / 5) * 5;
        label = `${start}-${start + 4}`;
      }
      bands[label] = (bands[label] || 0) + 1;
    }

    // Fixed order of bands
    const bandOrder = [
      "0-4", "5-9", "10-14", "15-19", "20-24", "25-29",
      "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60+"
    ];

    const chartData = bandOrder
      .filter((b) => (bands[b] || 0) > 0)
      .map((band) => ({
        band: band + " yr",
        count: bands[band] || 0,
        pct: ages.length > 0 ? ((bands[band] || 0) / ages.length * 100) : 0,
        bandKey: band,
      }));

    const sorted = [...ages].sort((a, b) => a - b);
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

    return {
      chartData,
      totalWithAge: ages.length,
      avgAge: ages.length > 0 ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0,
      medianAge: median,
    };
  }, [properties]);

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-[Space_Grotesk] font-semibold text-sm">
            Property Age Vintage
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            5-year bands — {totalWithAge} properties with age data
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Avg Age</p>
            <p className="font-[Space_Grotesk] font-bold text-sm">{avgAge} yr</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Median</p>
            <p className="font-[Space_Grotesk] font-bold text-sm">{medianAge} yr</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 50, top: 4, bottom: 4 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `${v}`}
          />
          <YAxis
            type="category"
            dataKey="band"
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 2,
              border: "1px solid oklch(0.92 0.004 286.32)",
            }}
            formatter={(value: number, _name: string, entry: any) => [
              `${value} properties (${entry.payload.pct.toFixed(1)}%)`,
              "Count",
            ]}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={20}>
            {chartData.map((entry) => (
              <Cell
                key={entry.bandKey}
                fill={AGE_COLORS[entry.bandKey] || "oklch(0.50 0.10 250)"}
              />
            ))}
            <LabelList
              dataKey="pct"
              position="right"
              formatter={(v: number) => `${v.toFixed(1)}%`}
              style={{ fontSize: 10, fill: "oklch(0.45 0.02 250)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Age summary strip */}
      <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Under 20 yr</p>
          <p className="font-semibold text-sm">
            {chartData.filter((d) => {
              const start = parseInt(d.bandKey);
              return start < 20;
            }).reduce((s, d) => s + d.count, 0)} <span className="text-muted-foreground font-normal">
              ({chartData.filter((d) => parseInt(d.bandKey) < 20).reduce((s, d) => s + d.pct, 0).toFixed(1)}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">20-39 yr</p>
          <p className="font-semibold text-sm">
            {chartData.filter((d) => {
              const start = parseInt(d.bandKey);
              return start >= 20 && start < 40;
            }).reduce((s, d) => s + d.count, 0)} <span className="text-muted-foreground font-normal">
              ({chartData.filter((d) => { const s = parseInt(d.bandKey); return s >= 20 && s < 40; }).reduce((s, d) => s + d.pct, 0).toFixed(1)}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">40+ yr</p>
          <p className="font-semibold text-sm text-[oklch(0.50_0.20_25)]">
            {chartData.filter((d) => {
              const start = parseInt(d.bandKey);
              return start >= 40;
            }).reduce((s, d) => s + d.count, 0)} <span className="font-normal">
              ({chartData.filter((d) => parseInt(d.bandKey) >= 40).reduce((s, d) => s + d.pct, 0).toFixed(1)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
