"use client";

import { useState } from "react";

export function LeadMagnetForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      portfolioSize: (form.elements.namedItem("portfolioSize") as HTMLInputElement).value,
    };

    try {
      await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Still show success
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <h4 className="text-xl font-bold text-white mb-2">Check your inbox!</h4>
        <p className="text-white/60 text-sm">Your PPP Starter Kit is on its way.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input type="text" name="name" placeholder="Full Name" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-colors" />
        <input type="email" name="email" placeholder="Work Email" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-colors" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input type="text" name="company" placeholder="Company" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-colors" />
        <input type="text" name="portfolioSize" placeholder="Portfolio Size (optional)" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-colors" />
      </div>
      <button type="submit" disabled={loading} className="w-full sm:w-auto btn btn-primary btn-lg mt-2 disabled:opacity-60">
        {loading ? "Sending..." : "Get the PPP Starter Kit \u2192"}
      </button>
      <p className="text-white/30 text-xs mt-2">No spam. Unsubscribe anytime.</p>
    </form>
  );
}
