"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function FooterNav() {
  const [modules, setModules] = useState<string[] | null>(null)

  useEffect(() => {
    fetch("/api/me/modules")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setModules(data?.modules ?? null))
      .catch(() => {})
  }, [])

  const showKB = !modules || modules.includes("knowledge-base")

  return (
    <div className="flex items-center gap-6">
      {showKB && (
        <Link href="/knowledge-base" className="hover:text-[#3B6B8F] transition-colors">
          AI Knowledge Base
        </Link>
      )}
      <a href="/platform-report.html" target="_blank" className="hover:text-[#3B6B8F] transition-colors">
        Platform Report
      </a>
      <a href="/proposal-status-report.html" target="_blank" className="hover:text-[#3B6B8F] transition-colors">
        Status Report
      </a>
    </div>
  )
}
