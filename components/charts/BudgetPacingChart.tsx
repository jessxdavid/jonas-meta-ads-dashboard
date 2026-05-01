"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./ChartTheme";
import { formatCurrency, formatDate } from "@/lib/format";

interface Row {
  date: string;
  spend: number;
}

export function BudgetPacingChart({
  data,
  budgetTarget,
}: {
  data: Row[];
  budgetTarget: number;
}) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickFormatter={formatDate}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
            }}
            labelFormatter={(l: string) => formatDate(l)}
            formatter={(value: number) => [formatCurrency(value), "Spend"]}
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }}
          />
          <Bar
            dataKey="spend"
            name="Daily Spend"
            fill={CHART_COLORS.accent}
            radius={[4, 4, 0, 0]}
          />
          <ReferenceLine
            y={budgetTarget}
            stroke={CHART_COLORS.positive}
            strokeDasharray="6 4"
            label={{
              value: `Target: ${formatCurrency(budgetTarget, { compact: true })}/day`,
              position: "right",
              fill: CHART_COLORS.positive,
              fontSize: 11,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
