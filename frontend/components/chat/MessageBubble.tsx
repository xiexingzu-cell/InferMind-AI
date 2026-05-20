"use client"

import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Components } from "react-markdown"
import type { ChatMessage } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

const markdownComponents: Components = {
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "")
    const isInline = !match

    if (isInline) {
      return (
        <code
          className="bg-white/7 border border-white/10 rounded px-1.5 py-0.5 text-[0.82em] font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: "0.6rem 0",
          borderRadius: "6px",
          fontSize: "0.8rem",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#050505",
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-geist-mono)" } }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    )
  },
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border/60 rounded-bl-sm",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose-chat">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-foreground/60 rounded-sm ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
