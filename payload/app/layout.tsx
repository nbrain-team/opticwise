import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: {
    default: "OpticWise | Own Your Data & Digital Infrastructure",
    template: "%s | OpticWise",
  },
  description:
    "OpticWise helps commercial real estate owners own and control their data & digital infrastructure to drive NOI, AI readiness, tenant experience, and long-term asset value.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
