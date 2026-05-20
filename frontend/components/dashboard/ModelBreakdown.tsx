"use client"

import type { ModelUsage } from "@/types"

interface Props {
  data: ModelUsage[]
}

export function ModelBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/40 py-6 text-center">暂无数据。</p>
    )
  }

  const max = Math.max(...data.map((d) => d.requests), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.model} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-foreground/80 truncate">{item.model}</span>
            <span className="text-muted-foreground tabular-nums ml-4 shrink-0">
              {item.requests.toLocaleString()} 次
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/30 transition-all duration-500"
              style={{ width: `${(item.requests / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
