"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type Point = { date: string; value: number };

const shortDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// One measure per day, one axis, one brand color (the card title names the
// series, so there's no legend). Counts are bars; money is an area.
export function DailyChart({ data, label, kind }: { data: Point[]; label: string; kind: "count" | "money" }) {
  const config = { value: { label, color: "var(--chart-1)" } } satisfies ChartConfig;
  const format = (v: number) => (kind === "money" ? `$${(v / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : v.toLocaleString("en-US"));
  const axis = {
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  } as const;
  const grid = <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />;
  const x = <XAxis dataKey="date" {...axis} tickFormatter={shortDay} minTickGap={24} />;
  const y = <YAxis {...axis} width={kind === "money" ? 52 : 28} allowDecimals={false} tickFormatter={format} />;
  const tooltip = (
    <ChartTooltip
      cursor={kind === "money" ? { stroke: "var(--muted-foreground)", strokeWidth: 1 } : { fill: "var(--muted)" }}
      content={<ChartTooltipContent labelFormatter={(_, p) => shortDay(String(p?.[0]?.payload?.date ?? ""))} formatter={(v) => [format(Number(v)), " ", label]} />}
    />
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full">
      {kind === "money" ? (
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          {grid}
          {x}
          {y}
          {tooltip}
          <Area dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} fill="var(--color-value)" fillOpacity={0.15} activeDot={{ r: 4, stroke: "var(--background)", strokeWidth: 2 }} />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
          {grid}
          {x}
          {y}
          {tooltip}
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={14} />
        </BarChart>
      )}
    </ChartContainer>
  );
}
