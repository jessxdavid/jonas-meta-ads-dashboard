"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
} from "recharts";
import type { Insight } from "@/types/meta";
import { CHART_COLORS } from "./ChartTheme";
import { formatCurrency, formatRoas, formatDate } from "@/lib/format";

export function SpendRoasChart({ data }: { data: Insight[] }) {
  const chartData = data.map((d) => ({
    date: d.date,
    spend: d.spend,
    roas: d.spend > 0 ? d.revenue / d.spend : 0,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickFormatter={formatDate}
          />
          <YAxis
            yAxisId="spend"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <YAxis
            yAxisId="roas"
            orientation="right"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(1)}x`}
          />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
            }}
            labelFormatter={(l: string) => formatDate(l)}
            formatter={(value: number, name: string) => {
              if (name === "Spend") return [formatCurrency(value), "Spend"];
              if (name === "ROAS") return [formatRoas(value), "ROAS"];
              return [value, name];
            }}
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }}
          />
          <Area
            yAxisId="spend"
            type="monotone"
            dataKey="spend"
            stroke={CHART_COLORS.accent}
            strokeWidth={2}
            fill="url(#spendGradient)"
            name="Spend"
          />
          <Line
            yAxisId="roas"
            type="monotone"
            dataKey="roas"
            stroke={CHART_COLORS.positive}
            strokeWidth={2}
            dot={false}
            name="ROAS"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
