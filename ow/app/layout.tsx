import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
            <Link href="/deals" className="flex items-center gap-3">
              <Image 
                src="/opticwise-logo.png" 
                alt="Opticwise" 
                width={140} 
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/deals" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Deals
              </Link>
              <Link href="/contacts" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Contacts
              </Link>
              <Link href="/organizations" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Organizations
              </Link>
              <Link href="/sales-inbox" className="nav-link hover:text-[#3B6B8F] transition-colors">
                Sales Inbox
              </Link>
              <Link href="/ownet-agent" className="nav-link hover:text-[#3B6B8F] transition-colors font-semibold border-l border-gray-300 pl-6 ml-2">
                🧠 OWnet Agent
              </Link>
            </nav>
            <form className="ml-auto" action={async () => {
              "use server";
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/auth/logout`, { method: "POST" });
            }}>
              <button className="text-sm border border-gray-300 rounded-full px-4 py-1.5 bg-white hover:bg-gray-50 transition-colors">
                Logout
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-7xl">{children}</main>
      </body>
    </html>
  );
}
