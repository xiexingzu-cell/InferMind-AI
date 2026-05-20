"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { nanoid } from "nanoid"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { api } from "@/lib/api-client"
import { readSSEStream } from "@/lib/stream"
import type { ChatMessage, Model } from "@/types"

const INTERNAL_KEY =
  process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "gw-dev-internal-key"
const DEFAULT_MODEL = "deepseek-chat"

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load models on mount
  useEffect(() => {
    api
      .models(INTERNAL_KEY)
      .then((res) => setModels(res.data))
      .catch(() => {
        setModels([
          { id: "gpt-4o", object: "model", owned_by: "openai" },
          { id: "gpt-4o-mini", object: "model", owned_by: "openai" },
          { id: "deepseek-chat", object: "model", owned_by: "deepseek" },
          { id: "deepseek-reasoner", object: "model", owned_by: "deepseek" },
        ])
      })
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    }

    const assistantId = nanoid()
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder])
    setInput("")
    setIsLoading(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await api.chat.stream(
        {
          model,
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
        },
        INTERNAL_KEY,
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
      }

      for await (const chunk of readSSEStream(res)) {
        if (controller.signal.aborted) break
        const delta = chunk.choices[0]?.delta?.content ?? ""
        if (delta) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + delta } : m,
            ),
          )
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return
      const msg = (err as Error).message ?? "Unknown error"
      setError(msg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [input, isLoading, model, messages])

  const handleStop = () => {
    abortRef.current?.abort()
    setIsLoading(false)
  }

  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/50 shrink-0">
        <span className="text-sm font-medium">Playground</span>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={handleClear}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              清空
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 select-none">
            <p className="text-lg font-mono text-muted-foreground/30">选择一个模型，开始对话</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={
              isLoading && i === messages.length - 1 && msg.role === "assistant"
            }
          />
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="flex gap-1 items-center h-8 px-4 rounded-xl bg-card border border-border/60">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.1s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onStop={handleStop}
          isLoading={isLoading}
          models={models.length ? models : [{ id: DEFAULT_MODEL, object: "model", owned_by: "deepseek" }]}
          model={model}
          onModelChange={setModel}
        />
      </div>
    </div>
  )
}
