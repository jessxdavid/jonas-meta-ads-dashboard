"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlacementSlice } from "@/types/meta";
import { CHART_COLORS } from "./ChartTheme";
import { formatCurrency } from "@/lib/format";

export function PlacementBar({ data }: { data: PlacementSlice[] }) {
  const sorted = [...data].sort((a, b) => b.spend - a.spend);
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
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <YAxis
            type="category"
            dataKey="placement"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={150}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
            }}
            formatter={(value: number) => [formatCurrency(value), "Spend"]}
          />
          <Bar
            dataKey="spend"
            fill={CHART_COLORS.accent}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
