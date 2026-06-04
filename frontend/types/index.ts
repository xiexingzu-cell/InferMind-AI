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

export interface CompetitionStageDefinition {
  id: string
  name: string
  description: string
}

export interface Competition {
  id: string
  name: string
  short_name: string
  category: string
  language: string
  description: string
  stages: CompetitionStageDefinition[]
}

export interface CompetitionStage extends CompetitionStageDefinition {
  status: "locked" | "ready" | "queued" | "running" | "completed" | "confirmed" | "failed"
  output: string
}

export interface CompetitionFile {
  id: string
  filename: string
  media_type: string
  size_bytes: number
  safety_status: "parsable" | "stored_only"
  created_at: string
}

export interface CompetitionArtifact {
  id: string
  stage_id: string
  filename: string
  media_type: string
  size_bytes: number
  created_at: string
}

export interface CompetitionProject {
  id: string
  competition_id: string
  title: string
  problem_statement: string
  notes: string
  status: string
  stages: CompetitionStage[]
  files: CompetitionFile[]
  artifacts: CompetitionArtifact[]
  created_at: string
  updated_at: string
}

export interface CompetitionProjectCreated extends CompetitionProject {
  access_token: string
}
