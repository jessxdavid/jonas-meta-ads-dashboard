"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DeviceSlice } from "@/types/meta";
import { CHART_COLORS } from "./ChartTheme";
import { formatCurrency, formatPercent } from "@/lib/format";

const DEVICE_COLORS: Record<string, string> = {
  mobile: CHART_COLORS.accent,
  desktop: CHART_COLORS.blue,
  tablet: CHART_COLORS.purple,
};

const DEVICE_LABEL: Record<string, string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  tablet: "Tablet",
};

export function DeviceDonut({ data }: { data: DeviceSlice[] }) {
  const total = data.reduce((s, d) => s + d.spend, 0);
  const chartData = data.map((d) => ({
    name: DEVICE_LABEL[d.device],
    value: d.spend,
    pct: total > 0 ? (d.spend / total) * 100 : 0,
    color: DEVICE_COLORS[d.device],
  }));

  return (
    <div className="flex h-[320px] w-full items-center gap-6">
      <ResponsiveContainer width="60%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
            }}
            formatter={(value: number, _name: string, props: { payload: { pct: number } }) => [
              `${formatCurrency(value)} (${formatPercent(props.payload.pct, 1)})`,
              "Spend",
            ]}
          />
          <Pie
            data={chartData}
            innerRadius={60}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-1 flex-col gap-3">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
              <span className="text-sm text-white">{d.name}</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-white">{formatPercent(d.pct, 1)}</div>
              <div className="font-mono text-xs text-[var(--color-text-secondary)]">
                {formatCurrency(d.value, { compact: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
