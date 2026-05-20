import { Sidebar } from "@/components/layout/Sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 ml-14 flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}
