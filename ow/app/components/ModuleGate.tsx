"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ModuleKey } from "@/lib/modules"

/**
 * Client-side module access gate. Wrap a page's content with this component
 * to redirect users who don't have access to the given module.
 */
export function ModuleGate({
  moduleKey,
  children,
}: {
  moduleKey: ModuleKey
  children: React.ReactNode
}) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/me/modules")
      .then((r) => r.json())
      .then((data) => {
        const modules: string[] = data.modules ?? []
        if (modules.includes(moduleKey)) {
          setAllowed(true)
        } else {
          setAllowed(false)
          router.replace("/dashboard")
        }
      })
      .catch(() => setAllowed(true))
  }, [moduleKey, router])

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B6B8F]" />
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}
