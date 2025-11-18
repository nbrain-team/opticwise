import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Opticwise CRM",
  description: "Internal CRM replica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 h-12 flex items-center gap-6">
            <Link href="/deals" className="font-semibold">
              Opticwise CRM
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/deals">Deals</Link>
              <Link href="/contacts">Contacts</Link>
              <Link href="/organizations">Organizations</Link>
              <Link href="/sales-inbox">Sales Inbox</Link>
            </nav>
            <form className="ml-auto" action={async () => {
              "use server";
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/auth/logout`, { method: "POST" });
            }}>
              <button className="text-sm border rounded px-3 py-1 bg-white">
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
