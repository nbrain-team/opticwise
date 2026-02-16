import Link from "next/link";
import { SITE } from "@/lib/site";

interface CTAProps {
  variant?: "primary" | "white" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function CTA({
  variant = "primary",
  size = "md",
  className = "",
}: CTAProps) {
  const base = "btn";
  const variants = {
    primary: "btn-primary",
    white: "btn-white",
    outline: "btn-outline",
  };
  const sizes = {
    sm: "btn-sm",
    md: "",
  };

  return (
    <Link
      href={SITE.primaryCTA.href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {SITE.primaryCTA.label}
    </Link>
  );
}
