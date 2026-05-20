"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Terminal, MessageSquare, KeyRound, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/chat", icon: MessageSquare, label: "对话" },
  { href: "/dashboard", icon: LayoutDashboard, label: "仪表盘" },
  { href: "/keys", icon: KeyRound, label: "API Keys" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-14 flex flex-col items-center py-4 border-r border-border/50 bg-sidebar z-40">
      {/* Logo */}
      <Link href="/" className="mb-6 mt-1">
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-accent transition-colors">
          <Terminal className="w-4 h-4 text-foreground/80" />
        </div>
      </Link>

      <div className="h-px w-8 bg-border/60 mb-4" />

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} title={label}>
              <div
                className={cn(
                  "w-9 h-9 rounded-md flex items-center justify-center transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-sidebar-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
