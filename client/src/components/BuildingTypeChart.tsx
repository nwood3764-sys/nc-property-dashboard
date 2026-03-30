/*
 * BuildingTypeChart — Horizontal bar chart showing property count by building type
 * Design: Civic Blueprint — navy/teal palette, clean labels
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BuildingTypeChartProps {
  data: { type: string; count: number }[];
}

const COLORS = [
  "oklch(0.40 0.06 250)",
  "oklch(0.50 0.15 240)",
  "oklch(0.55 0.12 200)",
  "oklch(0.45 0.15 155)",
  "oklch(0.50 0.20 25)",
  "oklch(0.60 0.17 60)",
  "oklch(0.55 0.10 300)",
  "oklch(0.50 0.10 180)",
  "oklch(0.45 0.08 120)",
  "oklch(0.55 0.05 250)",
  "oklch(0.60 0.12 30)",
];

export default function BuildingTypeChart({ data }: BuildingTypeChartProps) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <h3 className="font-[Space_Grotesk] font-semibold text-sm mb-3">
        Properties by Building Type
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="type"
            tick={{ fontSize: 10 }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 2,
              border: "1px solid oklch(0.92 0.004 286.32)",
            }}
            formatter={(value: number) => [value, "Properties"]}
          />
          <Bar dataKey="count" radius={[0, 2, 2, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
