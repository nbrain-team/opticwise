"use client";

import { SITE } from "@/lib/site";
import { ScheduleReviewButton } from "./ScheduleReviewPopup";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 z-0">
        <img src="/images/testimonial-bg.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(135deg, rgba(43,108,176,.92), rgba(30,78,140,.95))" }} />
      <div className="relative z-10 ow-container text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-4">Your Next Step</p>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-4 leading-tight">{SITE.primaryCTA.label}</h2>
        <p className="text-base text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">{SITE.primaryCTA.microcopy}</p>
        <ScheduleReviewButton className="btn btn-white btn-lg" label="Schedule Your Review" />
      </div>
    </section>
  );
}
