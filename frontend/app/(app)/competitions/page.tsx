"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Atom,
  ChartNoAxesCombined,
  FlaskConical,
  Globe2,
  Lightbulb,
  Network,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { publicCompetitionCatalog } from "@/lib/competition-catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Competition } from "@/types"

const INTERNAL_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "gw-dev-internal-key"

const COMPETITION_ICONS = {
  cumcm: {
    icon: ChartNoAxesCombined,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  "mcm-icm": {
    icon: Globe2,
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  "huawei-cup": {
    icon: Network,
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  innovation: {
    icon: Lightbulb,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  "physics-experiment": {
    icon: FlaskConical,
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  general: {
    icon: Atom,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
} as const

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>(publicCompetitionCatalog)
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    api.competitions.list(INTERNAL_KEY).then(setCompetitions).catch(() => setIsPreview(true))
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div>
            <Badge variant="outline" className="mb-3">Research Competition Workspace</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">大学生竞赛智能工作台</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              从赛题分析、方案设计到编程求解、科研图表与报告生成。每一步都可检查、确认和继续迭代。
            </p>
          </div>
        </div>

        {isPreview && <div className="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-sm text-muted-foreground">当前为界面预览。启动后端服务后即可创建项目并运行完整流程。</div>}
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.map((competition) => (
            <Link key={competition.id} href={`/competitions/new?type=${competition.id}`} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70">
              <Card className="h-full cursor-pointer border-border/70 bg-card/80 transition-all group-hover:-translate-y-0.5 group-hover:border-sky-500/50 group-hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 ${COMPETITION_ICONS[competition.id as keyof typeof COMPETITION_ICONS]?.className ?? COMPETITION_ICONS.general.className}`}>
                        {(() => {
                          const Icon = COMPETITION_ICONS[competition.id as keyof typeof COMPETITION_ICONS]?.icon ?? Atom
                          return <Icon className="h-5 w-5" />
                        })()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{competition.short_name}</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{competition.name}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{competition.language}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="min-h-10 text-sm leading-5 text-muted-foreground">{competition.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {competition.stages.map((stage) => <Badge key={stage.id} variant="outline">{stage.name}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
