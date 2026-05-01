"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./ChartTheme";
import { formatRoas } from "@/lib/format";

interface Row {
  name: string;
  roas: number;
  spend: number;
}

export function CampaignRoasBar({ data }: { data: Row[] }) {
  const sorted = [...data].sort((a, b) => b.roas - a.roas);
  const colorFor = (roas: number) => {
    if (roas >= 4) return CHART_COLORS.positive;
    if (roas >= 2) return CHART_COLORS.warning;
    return CHART_COLORS.negative;
  };

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickFormatter={(v: number) => `${v.toFixed(1)}x`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={180}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
            }}
            formatter={(value: number) => [formatRoas(value), "ROAS"]}
          />
          <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
            {sorted.map((row, i) => (
              <Cell key={i} fill={colorFor(row.roas)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
