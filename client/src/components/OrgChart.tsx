/**
 * Organization Breakdown Chart
 * Design: Civic Blueprint — horizontal bar chart showing top organizations by property count
 */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface OrgEntry {
  org: string;
  total: number;
  units: number;
  critical: number;
  high: number;
}

interface OrgChartProps {
  data: OrgEntry[];
}

const COLORS = ["#1a3c5e", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];

export default function OrgChart({ data }: OrgChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No organization data available for current filters.
      </div>
    );
  }

  // Truncate long org names
  const chartData = data.slice(0, 15).map((d) => ({
    ...d,
    label: d.org.length > 30 ? d.org.slice(0, 28) + "…" : d.org,
  }));

  return (
    <div>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 180, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: "#334155" }}
              width={175}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as OrgEntry & { label: string };
                return (
                  <div className="bg-white border border-border rounded-lg shadow-lg p-3 text-sm max-w-xs">
                    <p className="font-semibold text-foreground mb-1">{d.org}</p>
                    <div className="space-y-0.5 text-muted-foreground">
                      <p>Properties: <span className="font-medium text-foreground">{d.total}</span></p>
                      <p>Total Units: <span className="font-medium text-foreground">{d.units.toLocaleString()}</span></p>
                      <p>Critical: <span className="font-medium text-red-700">{d.critical}</span> · High: <span className="font-medium text-amber-700">{d.high}</span></p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Summary table below chart */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground">Organization</th>
              <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground">Properties</th>
              <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground">Units</th>
              <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground">Critical</th>
              <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground">High</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-1.5 px-2 font-medium text-foreground truncate max-w-[250px]" title={d.org}>{d.org}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{d.total}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{d.units.toLocaleString()}</td>
                <td className="text-right py-1.5 px-2 tabular-nums text-red-700 font-medium">{d.critical}</td>
                <td className="text-right py-1.5 px-2 tabular-nums text-amber-700 font-medium">{d.high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
