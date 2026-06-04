"use client"

import { ChangeEvent, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileArchive,
  FileText,
  ImageIcon,
  Loader2,
  Lock,
  Play,
  Table2,
  Upload,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CompetitionProject, CompetitionStage } from "@/types"

const INTERNAL_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "gw-dev-internal-key"

const STATUS_LABELS: Record<CompetitionStage["status"], string> = {
  locked: "等待前置阶段",
  ready: "可开始",
  queued: "排队中",
  running: "执行中",
  completed: "待确认",
  confirmed: "已确认",
  failed: "执行失败",
}

function stageTone(status: CompetitionStage["status"]) {
  if (status === "confirmed") return "border-emerald-500/40 bg-emerald-500/5"
  if (status === "completed") return "border-sky-500/50 bg-sky-500/5"
  if (status === "ready") return "border-amber-500/50 bg-amber-500/5"
  return "border-border/70"
}

function ArtifactIcon({ mediaType, filename }: { mediaType: string; filename: string }) {
  const lower = filename.toLowerCase()
  if (mediaType.startsWith("image/")) return <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
  if (mediaType === "text/csv" || lower.endsWith(".csv")) return <Table2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
  if (lower.endsWith(".zip")) return <FileArchive className="mt-0.5 h-3.5 w-3.5 shrink-0" />
  if (lower.includes("result") || lower.endsWith(".md")) return <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
  return <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
}

export default function CompetitionProjectPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const [project, setProject] = useState<CompetitionProject | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")
  const [projectToken] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem(`competition-project:${projectId}`) ?? "",
  )

  const refresh = useCallback(async () => {
    if (!projectToken) {
      setError("当前浏览器没有该项目的访问令牌。请从创建项目的浏览器重新进入。")
      return
    }
    try {
      setProject(await api.competitions.getProject(projectId, projectToken, INTERNAL_KEY))
      setError("")
    } catch (err) {
      setError((err as Error).message)
    }
  }, [projectId, projectToken])

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])
  useEffect(() => {
    if (!project?.stages.some((stage) => stage.status === "queued" || stage.status === "running")) return
    const timer = window.setInterval(refresh, 1500)
    return () => window.clearInterval(timer)
  }, [project, refresh])

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    setBusy("upload")
    setError("")
    try {
      for (const file of files) await api.competitions.uploadFile(projectId, projectToken, file, INTERNAL_KEY)
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      event.target.value = ""
      setBusy("")
    }
  }

  async function run(stageId: string) {
    setBusy(stageId)
    try {
      await api.competitions.runStage(projectId, stageId, projectToken, INTERNAL_KEY)
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy("")
    }
  }

  async function confirm(stageId: string) {
    setBusy(stageId)
    try {
      await api.competitions.confirmStage(projectId, stageId, projectToken, INTERNAL_KEY)
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy("")
    }
  }

  async function downloadArtifact(artifactId: string, filename: string, mediaType: string) {
    try {
      const blob = await api.competitions.downloadArtifact(projectId, artifactId, projectToken, INTERNAL_KEY)
      const url = URL.createObjectURL(blob)
      const lower = filename.toLowerCase()
      const canPreview =
        mediaType === "application/pdf" ||
        mediaType.startsWith("image/") ||
        mediaType.startsWith("text/") ||
        lower.endsWith(".pdf") ||
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".md") ||
        lower.endsWith(".csv") ||
        lower.endsWith(".txt")

      if (canPreview) {
        const opened = window.open(url, "_blank", "noopener,noreferrer")
        if (opened) {
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
          return
        }
      }

      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.rel = "noopener noreferrer"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Button variant="ghost" render={<Link href="/competitions" />} className="mb-4 px-0">
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回竞赛目录
        </Button>
        {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {!project ? <div className="text-sm text-muted-foreground">正在加载项目...</div> : (
          <>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-2">{project.competition_id}</Badge>
                <h1 className="text-2xl font-semibold">{project.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{project.problem_statement}</p>
              </div>
              <Badge variant="secondary">{project.status}</Badge>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                {project.stages.map((stage, index) => (
                  <Card key={stage.id} className={stageTone(stage.status)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-xs font-semibold">{index + 1}</div>
                          <div>
                            <CardTitle className="text-base">{stage.name}</CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">{stage.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{STATUS_LABELS[stage.status]}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stage.output && <div className="mb-4 whitespace-pre-wrap rounded-lg border bg-background/70 p-4 text-sm leading-6">{stage.output}</div>}
                      <div className="flex justify-end">
                        {(stage.status === "ready" || stage.status === "failed") && (
                          <Button size="sm" onClick={() => run(stage.id)} disabled={busy === stage.id}>
                            <Play className="mr-1 h-3.5 w-3.5" /> 开始执行
                          </Button>
                        )}
                        {(stage.status === "queued" || stage.status === "running") && <Loader2 className="h-5 w-5 animate-spin text-sky-500" />}
                        {stage.status === "completed" && (
                          <Button size="sm" onClick={() => confirm(stage.id)} disabled={busy === stage.id}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> 确认并继续
                          </Button>
                        )}
                        {stage.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">项目材料</CardTitle></CardHeader>
                  <CardContent>
                    <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed p-4 text-xs text-muted-foreground transition-colors hover:border-sky-500/60 hover:text-foreground">
                      {busy === "upload" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      上传赛题与数据
                      <input type="file" multiple className="hidden" onChange={uploadFiles} disabled={busy === "upload"} />
                    </label>
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground">单文件不超过 50 MB。未知格式仅保存，不自动解析。</p>
                    <div className="mt-4 space-y-2">
                      {project.files.map((file) => (
                        <div key={file.id} className="flex gap-2 rounded-md border p-2 text-xs">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate">{file.filename}</p>
                            <p className="mt-0.5 text-muted-foreground">{(file.size_bytes / 1024).toFixed(1)} KB · {file.safety_status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">执行说明</CardTitle></CardHeader>
                  <CardContent className="text-xs leading-5 text-muted-foreground">
                    每个阶段由服务端私有 Worker 处理。内部 Skill、提示词和代码执行能力不会暴露给浏览器。
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">阶段产物</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {project.artifacts.length === 0 && <p className="text-xs text-muted-foreground">执行阶段后将在这里生成可下载产物。</p>}
                    {project.artifacts.map((artifact) => (
                      <button key={artifact.id} type="button" onClick={() => downloadArtifact(artifact.id, artifact.filename, artifact.media_type)} className="flex w-full gap-2 rounded-md border p-2 text-left text-xs transition-colors hover:border-sky-500/50">
                        <ArtifactIcon mediaType={artifact.media_type} filename={artifact.filename} />
                        <span className="min-w-0">
                          <span className="block truncate">{artifact.filename}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{artifact.stage_id} · {(artifact.size_bytes / 1024).toFixed(1)} KB</span>
                        </span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
