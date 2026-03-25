import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PPP Data & Digital Infrastructure Review | OpticWise",
  description:
    "Schedule your CRE Data & Digital Infrastructure Review. Uncover hidden costs, broken tech stacks, and missed NOI opportunities in your commercial real estate portfolio.",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
