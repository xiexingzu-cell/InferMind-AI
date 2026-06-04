"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { publicCompetitionCatalog } from "@/lib/competition-catalog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Competition } from "@/types"

const INTERNAL_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "gw-dev-internal-key"

export default function NewCompetitionProjectPage() {
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>(publicCompetitionCatalog)
  const [competitionId, setCompetitionId] = useState(() =>
    typeof window === "undefined"
      ? "cumcm"
      : new URLSearchParams(window.location.search).get("type") ?? "cumcm",
  )
  const [title, setTitle] = useState("")
  const [problem, setProblem] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.competitions.list(INTERNAL_KEY).then(setCompetitions).catch(() => {})
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const project = await api.competitions.createProject({
        competition_id: competitionId,
        title,
        problem_statement: problem,
        notes,
      }, INTERNAL_KEY)
      localStorage.setItem(`competition-project:${project.id}`, project.access_token)
      router.push(`/competitions/${project.id}`)
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Button variant="ghost" render={<Link href="/competitions" />} className="mb-5 px-0">
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回竞赛目录
        </Button>
        <h1 className="text-2xl font-semibold">创建竞赛项目</h1>
        <p className="mt-2 text-sm text-muted-foreground">先提交基本信息。项目创建后可继续上传题目文件、数据表和参考材料。</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">竞赛与赛题</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm font-medium">竞赛类型
                <select className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={competitionId} onChange={(event) => setCompetitionId(event.target.value)}>
                  {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">项目标题
                <Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：城市交通拥堵评价与优化方案" required minLength={2} />
              </label>
              <label className="block text-sm font-medium">赛题内容
                <Textarea className="mt-2 min-h-56" value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="粘贴赛题文本、研究目标和已知条件。附件可以在下一步上传。" required minLength={10} />
              </label>
              <label className="block text-sm font-medium">补充说明
                <Textarea className="mt-2 min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="可选：已有思路、希望优先使用的方法、报告语言或其他限制。" />
              </label>
            </CardContent>
          </Card>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? "正在创建..." : "创建项目"} <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </form>
      </div>
    </div>
  )
}
