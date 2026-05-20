"use client"

import { useRef, useEffect } from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ModelSelector } from "./ModelSelector"
import type { Model } from "@/types"

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading: boolean
  models: Model[]
  model: string
  onModelChange: (m: string) => void
  disabled?: boolean
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  models,
  model,
  onModelChange,
  disabled,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (!isLoading && value.trim()) onSend()
    }
  }

  return (
    <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="发送消息… (Enter 发送，Shift+Enter 换行)"
        disabled={disabled || isLoading}
        className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
        rows={1}
      />
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/40">
        <ModelSelector
          models={models}
          value={model}
          onChange={onModelChange}
          disabled={isLoading}
        />
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={onStop}
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 px-3"
              onClick={onSend}
              disabled={!value.trim() || disabled}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Send</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
