"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DemographicSlice } from "@/types/meta";
import { CHART_COLORS } from "./ChartTheme";
import { formatNumber } from "@/lib/format";

export function AgeGenderChart({ data }: { data: DemographicSlice[] }) {
  const ages = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
  const grouped = ages.map((age) => {
    const female = data.find((d) => d.age === age && d.gender === "female")?.impressions ?? 0;
    const male = data.find((d) => d.age === age && d.gender === "male")?.impressions ?? 0;
    return { age, female, male };
  });

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={grouped} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="age"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v, { compact: true })}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: CHART_COLORS.card,
              border: "1px solid #282828",
              borderRadius: 8,
            }}
            formatter={(value: number, name: string) => [formatNumber(value), name]}
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }}
          />
          <Bar dataKey="female" name="Female" fill={CHART_COLORS.pink} radius={[4, 4, 0, 0]} />
          <Bar dataKey="male" name="Male" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
