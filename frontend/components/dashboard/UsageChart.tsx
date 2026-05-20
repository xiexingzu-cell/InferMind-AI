"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DailyUsage } from "@/types"

interface Props {
  data: DailyUsage[]
  metric: "requests" | "tokens"
}

const TICK_COLOR = "oklch(0.52 0 0)"
const LINE_COLOR = "oklch(0.75 0 0)"
const GRID_COLOR = "rgba(255,255,255,0.05)"

function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00Z")
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

function formatTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(value)
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label ? formatDate(label) : ""}</p>
      <p className="font-medium tabular-nums">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

export function UsageChart({ data, metric }: Props) {
  const sliced = data.slice(-14)

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={sliced} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 10, fill: TICK_COLOR }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatTick}
          tick={{ fontSize: 10, fill: TICK_COLOR }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
        <Line
          type="monotone"
          dataKey={metric}
          stroke={LINE_COLOR}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: LINE_COLOR, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
