import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata: Metadata = {
  title: "InferMind — Multi-model API Platform",
  description:
    "OpenAI-compatible AI gateway. Access GPT, DeepSeek, and Gemini through a single API endpoint.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark h-full antialiased">
      <body className="h-full bg-background text-foreground">
        <TooltipProvider delay={300}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
