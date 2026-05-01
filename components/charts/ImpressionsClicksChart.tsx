"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./ChartTheme";
import { formatDate, formatNumber } from "@/lib/format";
import type { Insight } from "@/types/meta";

export function ImpressionsClicksChart({ data }: { data: Insight[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickFormatter={formatDate}
          />
          <YAxis
            yAxisId="impressions"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v, { compact: true })}
          />
          <YAxis
            yAxisId="clicks"
            orientation="right"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v, { compact: true })}
          />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
            }}
            labelFormatter={(l: string) => formatDate(l)}
            formatter={(value: number, name: string) => [formatNumber(value), name]}
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }}
          />
          <Line
            yAxisId="impressions"
            type="monotone"
            dataKey="impressions"
            stroke={CHART_COLORS.blue}
            strokeWidth={2}
            dot={false}
            name="Impressions"
          />
          <Line
            yAxisId="clicks"
            type="monotone"
            dataKey="clicks"
            stroke={CHART_COLORS.purple}
            strokeWidth={2}
            dot={false}
            name="Clicks"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
