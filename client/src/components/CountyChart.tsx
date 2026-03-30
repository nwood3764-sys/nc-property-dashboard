import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CountyData {
  county: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface CountyChartProps {
  data: CountyData[];
}

export default function CountyChart({ data }: CountyChartProps) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <h3 className="font-[Space_Grotesk] font-semibold text-sm text-foreground mb-4">
        Properties by County — Top 20
      </h3>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              dataKey="county"
              type="category"
              tick={{ fontSize: 11 }}
              width={75}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid oklch(0.90 0.01 250)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="critical" stackId="a" fill="oklch(0.50 0.20 25)" name="Critical" />
            <Bar dataKey="high" stackId="a" fill="oklch(0.65 0.17 60)" name="High" />
            <Bar dataKey="medium" stackId="a" fill="oklch(0.55 0.15 240)" name="Medium" />
            <Bar dataKey="low" stackId="a" fill="oklch(0.50 0.15 155)" name="Low" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
