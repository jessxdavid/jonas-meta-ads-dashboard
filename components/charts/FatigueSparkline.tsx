"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./ChartTheme";
import { formatDate, formatPercent } from "@/lib/format";

interface Row {
  date: string;
  ctr: number;
  frequency: number;
}

export function FatigueSparkline({ data }: { data: Row[] }) {
  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide yAxisId="ctr" />
          <YAxis hide yAxisId="freq" orientation="right" />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
              fontSize: 11,
            }}
            labelFormatter={(l: string) => formatDate(l)}
            formatter={(value: number, name: string) => {
              if (name === "CTR") return [formatPercent(value), "CTR"];
              if (name === "Frequency") return [`${value.toFixed(2)}x`, "Frequency"];
              return [value, name];
            }}
          />
          <Line
            yAxisId="ctr"
            type="monotone"
            dataKey="ctr"
            stroke={CHART_COLORS.accent}
            strokeWidth={2}
            dot={false}
            name="CTR"
          />
          <Line
            yAxisId="freq"
            type="monotone"
            dataKey="frequency"
            stroke={CHART_COLORS.warning}
            strokeWidth={2}
            dot={false}
            name="Frequency"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
