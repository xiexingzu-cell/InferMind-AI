"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Model } from "@/types"

interface Props {
  models: Model[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  deepseek: "DeepSeek",
  google: "Google",
}

export function ModelSelector({ models, value, onChange, disabled }: Props) {
  const grouped = models.reduce<Record<string, Model[]>>((acc, m) => {
    const group = m.owned_by
    if (!acc[group]) acc[group] = []
    acc[group].push(m)
    return acc
  }, {})

  return (
    <Select
      value={value}
      onValueChange={(v) => { if (v != null) onChange(v) }}
      disabled={disabled}
    >
      <SelectTrigger className="w-44 h-8 text-xs font-mono border-border/60 bg-muted/30">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="font-mono text-xs">
        {Object.entries(grouped).map(([provider, providerModels]) => (
          <div key={provider}>
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
              {PROVIDER_LABEL[provider] ?? provider}
            </div>
            {providerModels.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.id}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  )
}
