export type MessageRole = "system" | "user" | "assistant"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: number
}

export interface Model {
  id: string
  object: string
  owned_by: string
  created?: number
}

export interface ApiKeyRecord {
  id: number
  name: string
  key: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
  total_requests: number
  total_tokens: number
}

export interface ChatCompletionRequest {
  model: string
  messages: Array<{ role: MessageRole; content: string }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface DailyUsage {
  date: string
  requests: number
  tokens: number
}

export interface ModelUsage {
  model: string
  requests: number
  tokens: number
}

export interface UsageSummary {
  total_requests: number
  total_tokens: number
  active_keys: number
  models_used: number
  daily: DailyUsage[]
  by_model: ModelUsage[]
}

export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: { role?: string; content?: string }
    finish_reason: string | null
  }>
}
