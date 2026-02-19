import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "5S® Wireless Connectivity",
  description: "OpticWise's wireless connectivity product delivering the 5S® user experience over owner-controlled data & digital infrastructure.",
};

export default function Page() {
  return (
    <ContentPage
      slug="5s-wireless-connectivity"
      title="5S® Wireless Connectivity"
      lead="OpticWise's wireless connectivity product delivering the 5S® user experience over owner-controlled data & digital infrastructure."
      badge="Product"
    />
  );
}
