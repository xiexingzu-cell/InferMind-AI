"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, GitBranch, Code2, ArrowRight, Terminal } from "lucide-react"

const CODE_EXAMPLE = `from openai import OpenAI

client = OpenAI(
    api_key="gw-your-key-here",
    base_url="https://api.yourgateway.com/v1",
)

response = client.chat.completions.create(
    model="deepseek-chat",   # or gpt-4o, gemini-...
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content, end="")`

const features = [
  {
    icon: GitBranch,
    title: "多模型路由",
    desc: "GPT-4o、DeepSeek、Gemini — 统一入口。改一个字符串就能切换模型。",
  },
  {
    icon: Code2,
    title: "OpenAI 兼容 API",
    desc: "即插即用。任何基于 OpenAI API 的 SDK 或工具无需修改即可接入。",
  },
  {
    icon: Zap,
    title: "实时流式输出",
    desc: "完整的 SSE 流式支持。毫秒级首 token 延迟，逐 token 实时返回。",
  },
]

const models = ["gpt-4o", "gpt-4o-mini", "deepseek-chat", "deepseek-reasoner", "o1-mini"]

export default function LandingPage() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-semibold tracking-tight">AI Gateway</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/chat"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              对话
            </Link>
            <Link
              href="/keys"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              API Keys
            </Link>
            <Button size="sm" render={<Link href="/chat" />}>
              开始使用
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-32 pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 mb-20"
        >
          <Badge
            variant="secondary"
            className="text-xs font-mono tracking-widest uppercase"
          >
            OpenAI 兼容
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-tight">
            One API.
            <br />
            <span className="text-muted-foreground">Every model.</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            一个自托管的 AI 网关，将 GPT、DeepSeek 和 Gemini 的请求通过
            一个 OpenAI 兼容接口统一转发。
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" render={<Link href="/chat" />}>
              打开 Playground
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/keys" />}>
              获取 API Key
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {models.map((m) => (
              <span
                key={m}
                className="font-mono text-xs px-2.5 py-1 rounded border border-border/60 text-muted-foreground bg-muted/30"
              >
                {m}
              </span>
            ))}
            <span className="text-xs text-muted-foreground/50">+ 更多</span>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
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
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Code snippet */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-lg border border-border/60 bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-border/80" />
              <div className="w-3 h-3 rounded-full bg-border/80" />
              <div className="w-3 h-3 rounded-full bg-border/80" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">example.py</span>
            <div />
          </div>
          <pre className="p-6 overflow-x-auto text-sm font-mono text-foreground/80 leading-relaxed">
            <code>{CODE_EXAMPLE}</code>
          </pre>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">AI Gateway v0.1</span>
          <span>基于 FastAPI + Next.js 构建</span>
        </div>
      </footer>
    </div>
  )
}
