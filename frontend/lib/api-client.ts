import type { Model, ApiKeyRecord, ChatCompletionRequest, UsageSummary } from "@/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(
  path: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.error?.message ?? message
    } catch {}
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  models: (apiKey: string) =>
    request<{ object: string; data: Model[] }>("/v1/models", apiKey),

  chat: {
    complete: (body: ChatCompletionRequest, apiKey: string) =>
      request("/v1/chat/completions", apiKey, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    stream: (body: ChatCompletionRequest, apiKey: string): Promise<Response> =>
      fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ ...body, stream: true }),
      }),
  },

  keys: {
    list: (apiKey: string) => request<ApiKeyRecord[]>("/api/keys", apiKey),

    create: (name: string, apiKey: string) =>
      request<ApiKeyRecord>("/api/keys", apiKey, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),

    revoke: (id: number, apiKey: string) =>
      request<void>(`/api/keys/${id}`, apiKey, { method: "DELETE" }),
  },

  usage: (apiKey: string, days = 30) =>
    request<UsageSummary>(`/api/usage?days=${days}`, apiKey),
}
