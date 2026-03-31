import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { logout } from "./actions/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Opticwise CRM",
  description: "Professional CRM Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image 
                src="/opticwise-logo.png" 
                alt="Opticwise" 
                width={140} 
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/dashboard" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Dashboard
              </Link>
              <Link href="/deals" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Deals
              </Link>
              <Link href="/contacts" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Contacts
              </Link>
              <Link href="/organizations" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Organizations
              </Link>
              <Link href="/campaigns" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Campaigns
              </Link>
              <Link href="/conferences" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Conferences
              </Link>
              <Link href="/sales-inbox" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Sales Inbox
              </Link>
              <Link href="/meeting-transcripts" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Transcripts
              </Link>
              <Link href="/linkedin" className="nav-link hover:text-[#0A66C2] transition-colors font-semibold border-l border-gray-300 pl-6 ml-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                LinkedIn
              </Link>
              <Link href="/ownet-agent" className="nav-link hover:text-[#3B6B8F] transition-colors font-semibold pl-4">
                OWnet Agent
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Link 
                href="/settings"
                className="text-sm text-gray-700 hover:text-[#3B6B8F] transition-colors flex items-center gap-1"
                title="Account Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </Link>
              <form action={logout}>
                <button 
                  type="submit"
                  className="text-sm border border-gray-300 rounded-full px-4 py-1.5 bg-white hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl min-h-[calc(100vh-8rem)]">{children}</main>
        <footer className="border-t bg-white mt-12">
          <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between text-sm text-gray-500">
            <p>© {new Date().getFullYear()} OpticWise. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/knowledge-base" className="hover:text-[#3B6B8F] transition-colors">
                AI Knowledge Base
              </Link>
              <a href="/platform-report.html" target="_blank" className="hover:text-[#3B6B8F] transition-colors">
                Platform Report
              </a>
              <a href="/proposal-status-report.html" target="_blank" className="hover:text-[#3B6B8F] transition-colors">
                Status Report
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
