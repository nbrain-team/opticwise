"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { ModuleKey } from "@/lib/modules"

type NavItem = { href: string; label: string; moduleKey: ModuleKey; icon?: React.ReactNode }

const MORE_ITEMS: NavItem[] = [
  {
    href: "/social",
    label: "Social",
    moduleKey: "social",
    icon: (
      <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  { href: "/meeting-transcripts", label: "Transcripts", moduleKey: "meeting-transcripts" },
  { href: "/conferences", label: "Conferences", moduleKey: "conferences" },
  { href: "/campaigns", label: "Campaigns", moduleKey: "campaigns" },
  {
    href: "/forms",
    label: "Forms",
    moduleKey: "forms",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/blog",
    label: "Blog Publisher",
    moduleKey: "blog",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Profile",
    moduleKey: "deals", // always visible — settings is not module-gated
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const PRIMARY_ITEMS: NavItem[] = [
  { href: "/deals", label: "Deals", moduleKey: "deals" },
  { href: "/contacts", label: "Contacts", moduleKey: "contacts" },
  { href: "/organizations", label: "Organizations", moduleKey: "organizations" },
  { href: "/sales-inbox", label: "Sales Inbox", moduleKey: "sales-inbox" },
]

export default function MainNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null)

  useEffect(() => {
    fetch("/api/me/modules")
      .then((r) => r.json())
      .then((data) => setAllowedModules(data.modules ?? []))
      .catch(() => setAllowedModules(null))
  }, [])

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [moreOpen])

  function hasAccess(moduleKey: ModuleKey): boolean {
    if (!allowedModules) return true // still loading — show everything briefly
    return allowedModules.includes(moduleKey)
  }

  // Settings/Profile is always visible
  const isAlwaysVisible = (item: NavItem) => item.href === "/settings"

  const visiblePrimary = PRIMARY_ITEMS.filter((item) => hasAccess(item.moduleKey))
  const visibleMore = MORE_ITEMS.filter((item) => isAlwaysVisible(item) || hasAccess(item.moduleKey))

  const isMoreActive = visibleMore.some((item) => pathname?.startsWith(item.href))

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      <Link href="/dashboard" className="nav-link hover:text-[#3B6B8F] transition-colors">
        Dashboard
      </Link>

      {visiblePrimary.map((item) => (
        <Link key={item.href} href={item.href} className="nav-link hover:text-[#3B6B8F] transition-colors">
          {item.label}
        </Link>
      ))}

      {visibleMore.length > 0 && (
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className={`nav-link inline-flex items-center gap-1 transition-colors ${
              isMoreActive ? "text-[#3B6B8F]" : "hover:text-[#3B6B8F]"
            }`}
          >
            More
            <svg
              className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50"
            >
              {visibleMore.map((item) => {
                const active = pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      active
                        ? "bg-gray-50 text-[#3B6B8F] font-semibold"
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#3B6B8F]"
                    }`}
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {hasAccess("ownet-agent") && (
        <Link
          href="/ownet-agent"
          className="nav-link hover:text-[#3B6B8F] transition-colors font-semibold border-l border-gray-300 pl-6 ml-2"
        >
          OWnet Agent
        </Link>
      )}
      {hasAccess("cs-agent") && (
        <Link
          href="/support-agent"
          className="nav-link hover:text-[#0f766e] transition-colors font-semibold flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          CS Agent
        </Link>
      )}
    </nav>
  )
}
