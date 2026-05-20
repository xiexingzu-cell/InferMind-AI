"use client"

import { useState, useEffect } from "react"
import { Activity, Hash, Key, Cpu, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { UsageChart } from "@/components/dashboard/UsageChart"
import { ModelBreakdown } from "@/components/dashboard/ModelBreakdown"
import { api } from "@/lib/api-client"
import type { UsageSummary } from "@/types"

const INTERNAL_KEY =
  process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "gw-dev-internal-key"

const DAYS_OPTIONS = [7, 14, 30] as const
type Days = (typeof DAYS_OPTIONS)[number]

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

export default function DashboardPage() {
  const [data, setData] = useState<UsageSummary | null>(null)
  const [days, setDays] = useState<Days>(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load(days)
  }, [])

  const load = async (d: Days) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.usage(INTERNAL_KEY, d)
      setData(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDaysChange = (d: Days) => {
    setDays(d)
    load(d)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-border/50 shrink-0">
        <span className="text-sm font-medium">仪表盘</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/40 border border-border/40">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`px-2.5 py-1 text-xs rounded-sm transition-colors ${
                  days === d
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground"
            onClick={() => load(days)}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading || !data ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          ) : (
            <>
              <StatsCard
                title="总请求数"
                value={fmt(data.total_requests)}
                sub={`近 ${days} 天`}
                icon={Activity}
              />
              <StatsCard
                title="总 Token"
                value={fmt(data.total_tokens)}
                sub={`近 ${days} 天`}
                icon={Hash}
              />
              <StatsCard title="活跃 Key" value={data.active_keys} icon={Key} />
              <StatsCard title="使用模型数" value={data.models_used} icon={Cpu} />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border border-border/60 bg-card p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              每日请求数
            </p>
            {loading || !data ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <UsageChart data={data.daily} metric="requests" />
            )}
          </div>

          <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              按模型分布
            </p>
            {loading || !data ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <ModelBreakdown data={data.by_model} />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            每日 Token 消耗
          </p>
          {loading || !data ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <UsageChart data={data.daily} metric="tokens" />
          )}
        </div>
      </div>
    </div>
  )
}
