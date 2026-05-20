import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { logout } from "./actions/auth";
import MainNav from "./components/MainNav";
import FooterNav from "./components/FooterNav";
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
            <MainNav />
            <div className="ml-auto flex items-center gap-3">
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
