"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Beaker,
  BookOpenText,
  BrainCircuit,
  Code2,
  GitBranch,
  Terminal,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const CODE_EXAMPLE = `from openai import OpenAI

client = OpenAI(
    api_key="gw-your-key",
    base_url="https://your-domain.com/v1",
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是一个严谨的科研推理助手。"},
        {"role": "user", "content": "请帮我拆解这个实验设计问题。"},
    ],
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`

const features = [
  {
    icon: BrainCircuit,
    title: "科研推理工作台",
    desc: "围绕问题拆解、假设澄清、方法选择、局限性分析和下一步研究建议组织 AI 输出。",
  },
  {
    icon: Beaker,
    title: "工程与科学工作流",
    desc: "面向论文写作、数学建模、实验设计、数据分析、科学计算与技术报告生成。",
  },
  {
    icon: GitBranch,
    title: "多模型推理底座",
    desc: "通过 OpenAI 兼容接口接入 GPT、DeepSeek 等模型，并为后续 Provider 扩展预留架构。",
  },
]

const scenarios = [
  "论文写作",
  "文献综述",
  "数学推导",
  "Python 科学计算",
  "COMSOL 建模",
  "实验设计",
  "数据分析",
  "科研绘图",
  "LaTeX",
  "数学建模竞赛",
]

export default function LandingPage() {
  return (
    <div className="min-h-full flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-semibold tracking-tight">InferMind</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/chat"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              工作台
            </Link>
            <Link
              href="/keys"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              API Keys
            </Link>
            <Button size="sm" render={<Link href="/chat" />}>
              开始研究
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-6 pt-32 pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center space-y-6 mb-20"
        >
          <Badge
            variant="secondary"
            className="text-xs font-mono tracking-widest uppercase"
          >
            Research Intelligence Workspace
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-tight">
            让 AI 真正参与研究
            <br />
            <span className="text-muted-foreground">而不是聊天。</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            InferMind 是面向科研、工程、技术研究与严肃知识工作的 AI 推理工作台，
            帮助你拆解问题、建立模型、分析数据、生成报告，并沉淀可复用的研究工作流。
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" render={<Link href="/chat" />}>
              打开研究工作台
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/keys" />}>
              开发者 API
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {scenarios.map((scenario) => (
              <span
                key={scenario}
                className="font-mono text-xs px-2.5 py-1 rounded border border-border/60 text-muted-foreground bg-muted/30"
              >
                {scenario}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-lg border border-border/60 bg-card p-6 space-y-3"
            >
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Icon className="w-4 h-4 text-foreground/70" />
              </div>
              <h3 className="font-medium text-sm">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4"
        >
          <div className="rounded-lg border border-border/60 bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpenText className="w-4 h-4 text-muted-foreground" />
              工作方式
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>1. 先理解真正问题，而不是直接给结论。</p>
              <p>2. 拆解任务、列出假设、说明方法路径。</p>
              <p>3. 区分事实与推断，标注限制和不确定性。</p>
              <p>4. 给出可执行的下一步研究建议。</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-border/80" />
                <div className="w-3 h-3 rounded-full bg-border/80" />
                <div className="w-3 h-3 rounded-full bg-border/80" />
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">
                  openai-compatible.py
                </span>
              </div>
              <div />
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono text-foreground/80 leading-relaxed">
              <code>{CODE_EXAMPLE}</code>
            </pre>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border/50 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">InferMind v0.1</span>
          <span>面向科研与工程的 AI 推理工作台</span>
        </div>
      </footer>
    </div>
  )
}
