"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api-client"
import type { ApiKeyRecord } from "@/types"

const STORAGE_KEY = "gateway_api_key"

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }
  return { copy, copied }
}

export default function KeysPage() {
  const [adminKey, setAdminKey] = useState<string>("")
  const [keyInput, setKeyInput] = useState("")
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [newKeyName, setNewKeyName] = useState("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { copy, copied } = useCopy()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? ""
    setAdminKey(stored)
    if (stored) loadKeys(stored)
  }, [])

  const loadKeys = async (key: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.keys.list(key)
      setKeys(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newKeyName.trim() || !adminKey) return
    setCreating(true)
    setError(null)
    try {
      const created = await api.keys.create(newKeyName.trim(), adminKey)
      setKeys((prev) => [created, ...prev])
      setNewKeyName("")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: number) => {
    if (!adminKey) return
    try {
      await api.keys.revoke(id, adminKey)
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: false } : k)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Key gate
  if (!adminKey) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-1">
            <h2 className="font-semibold text-sm">输入管理员 API Key</h2>
            <p className="text-xs text-muted-foreground">
              你需要一个管理员 Key 才能管理 API Keys。
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="gw-..."
              className="font-mono text-xs h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter" && keyInput.trim()) {
                  const k = keyInput.trim()
                  localStorage.setItem(STORAGE_KEY, k)
                  setAdminKey(k)
                  loadKeys(k)
                }
              }}
            />
            <Button
              size="sm"
              className="h-9 shrink-0"
              disabled={!keyInput.trim()}
              onClick={() => {
                const k = keyInput.trim()
                localStorage.setItem(STORAGE_KEY, k)
                setAdminKey(k)
                loadKeys(k)
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-border/50 shrink-0">
        <span className="text-sm font-medium">API Keys</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Create new key */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            新建 Key
          </h3>
          <div className="flex gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="名称（如 my-app）"
              className="max-w-xs h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
            />
            <Button
              size="sm"
              className="h-9"
              disabled={!newKeyName.trim() || creating}
              onClick={handleCreate}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {creating ? "创建中…" : "创建"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Key list */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            活跃 Key
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <p className="text-xs text-muted-foreground/50">暂无 Key。</p>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{k.name}</span>
                      <Badge
                        variant={k.is_active ? "secondary" : "outline"}
                        className="text-[10px] h-4 px-1.5"
                      >
                        {k.is_active ? "活跃" : "已吊销"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      <span>{k.key.slice(0, 8)}…{k.key.slice(-6)}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{k.total_requests.toLocaleString()} 次请求</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{k.total_tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => copy(k.key)}
                      title="复制 Key"
                    >
                      {copied === k.key ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    {k.is_active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRevoke(k.id)}
                        title="吊销 Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
