import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  title: string
  value: string | number
  sub?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
}

export function StatsCard({ title, value, sub, icon: Icon, trend }: Props) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {sub && (
          <p
            className={cn(
              "text-xs mt-0.5",
              trend === "up"
                ? "text-green-500"
                : trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
