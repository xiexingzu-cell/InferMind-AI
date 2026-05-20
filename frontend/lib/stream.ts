import type { ChatCompletionChunk } from "@/types"

export async function* readSSEStream(
  response: Response,
): AsyncGenerator<ChatCompletionChunk> {
  if (!response.body) throw new Error("No response body")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") return
        try {
          yield JSON.parse(data) as ChatCompletionChunk
        } catch {}
      }
    }
  } finally {
    reader.releaseLock()
  }
}
