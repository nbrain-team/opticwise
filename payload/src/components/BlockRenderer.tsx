"use client";

import { getMediaUrl } from "@/lib/media-utils";
import { ScheduleReviewButton } from "./ScheduleReviewPopup";
import { LeadMagnetForm } from "./LeadMagnetForm";

const ICON_PATHS: Record<string, string> = {
  "chart-up": "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  lightbulb: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  flask: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  network: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  globe: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
  wifi: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0",
  data: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
  brain: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
};

const ICON_COLORS: Record<string, string> = {
  blue: "from-ow-blue to-ow-blue-dark",
  green: "from-emerald-500 to-emerald-600",
  red: "from-red-500 to-red-600",
  amber: "from-amber-500 to-amber-600",
  purple: "from-purple-500 to-purple-600",
};

function Icon({ name, color = "blue", size = 26 }: { name?: string; color?: string; size?: number }) {
  const d = ICON_PATHS[name || ""] || ICON_PATHS["chart-up"];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={d} />
    </svg>
  );
}

export function BlockRenderer({ blocks }: { blocks: any[] }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <>
      {blocks.map((block: any, index: number) => (
        <RenderBlock key={block.id || index} block={block} />
      ))}
    </>
  );
}

function RenderBlock({ block }: { block: any }) {
  switch (block.blockType) {
    case "hero":
      return <HeroRenderer block={block} />;
    case "content":
      return <ContentRenderer block={block} />;
    case "cardGrid":
      return <CardGridRenderer block={block} />;
    case "cta":
      return <CTARenderer block={block} />;
    case "twoLayerModel":
      return <TwoLayerModelRenderer block={block} />;
    case "leadMagnet":
      return <LeadMagnetRenderer block={block} />;
    case "faq":
      return <FAQRenderer block={block} />;
    case "timeline":
      return <TimelineRenderer block={block} />;
    case "deliverables":
      return <DeliverablesRenderer block={block} />;
    default:
      return null;
  }
}

function HeroRenderer({ block }: { block: any }) {
  const bgImage = getMediaUrl(block.backgroundImage) || "/images/hero-industry.jpg";
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-20">
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="hero-overlay" />
      <div className="hero-grid-lines" />
      <div className="relative z-10 ow-container text-center">
        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight mb-7">
          {block.heading}
          {block.headingHighlight && (
            <>
              {" "}
              <span className="text-gradient">{block.headingHighlight}</span>
            </>
          )}
        </h1>
        {block.description && (
          <p className="text-lg lg:text-xl text-white/85 max-w-4xl mx-auto mb-4 leading-relaxed">
            {block.description}
          </p>
        )}
        {block.secondaryText && (
          <p className="text-base text-white/60 mb-8">{block.secondaryText}</p>
        )}
        {block.calloutText && (
          <div className="max-w-3xl mx-auto px-7 py-5 rounded-xl bg-ow-blue/15 border border-blue-400/30 backdrop-blur-sm mb-9">
            <p className="text-lg font-bold text-white m-0">{block.calloutText}</p>
          </div>
        )}
        {block.buttons && block.buttons.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center">
            {block.buttons.map((btn: any, i: number) => {
              if (btn.isScheduleReview) {
                const cls =
                  btn.style === "outline-light" ? "btn btn-outline-light btn-lg" :
                  btn.style === "white" ? "btn btn-white btn-lg" :
                  "btn btn-primary btn-lg";
                return <ScheduleReviewButton key={i} className={cls} label={btn.label} />;
              }
              const cls =
                btn.style === "outline-light" ? "btn btn-outline-light btn-lg" :
                btn.style === "white" ? "btn btn-white btn-lg" :
                "btn btn-primary btn-lg";
              return (
                <a key={i} href={btn.href} className={cls}>{btn.label}</a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ContentRenderer({ block }: { block: any }) {
  const bgClass = block.backgroundColor === "gray" ? "bg-gray-50" : block.backgroundColor === "dark" ? "bg-ow-navy" : "bg-white";
  const isDark = block.backgroundColor === "dark";
  const image = getMediaUrl(block.image);

  if (block.layout === "two-column" && image) {
    const imgEl = (
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        <img src={image} alt="" className="w-full" />
      </div>
    );
    const textEl = (
      <div>
        {block.eyebrow && (
          <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-blue-300" : "text-ow-blue"} mb-3 block`}>
            {block.eyebrow}
          </span>
        )}
        {block.heading && (
          <h2 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? "text-white" : "text-gray-900"} leading-tight mb-2`}>
            {block.heading}
          </h2>
        )}
        <div className="accent-bar mb-6" />
        {block.richText && (
          <div className={`rich-content ${isDark ? "text-white/70" : ""}`}>
            <RichTextContent content={block.richText} />
          </div>
        )}
      </div>
    );

    return (
      <section className={`ow-section ${bgClass}`}>
        <div className="ow-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {block.imagePosition === "right" ? <>{textEl}{imgEl}</> : <>{imgEl}{textEl}</>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`ow-section ${bgClass}`}>
      <div className={`ow-container ${block.layout === "narrow" ? "max-w-3xl mx-auto" : ""}`}>
        {block.eyebrow && (
          <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-blue-300" : "text-ow-blue"} mb-3 block`}>
            {block.eyebrow}
          </span>
        )}
        {block.heading && (
          <h2 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? "text-white" : "text-gray-900"} leading-tight mb-6`}>
            {block.heading}
          </h2>
        )}
        {block.richText && (
          <div className={`rich-content ${isDark ? "text-white/70" : ""}`}>
            <RichTextContent content={block.richText} />
          </div>
        )}
      </div>
    </section>
  );
}

function CardGridRenderer({ block }: { block: any }) {
  const isDark = block.style === "dark";
  const bgClass = isDark ? "bg-ow-navy" : block.style === "light" ? "bg-gray-50" : "bg-white";
  const cols = block.columns === "2" ? "sm:grid-cols-2" : block.columns === "4" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className={`ow-section ${bgClass}`}>
      <div className="ow-container">
        {(block.eyebrow || block.heading) && (
          <div className="text-center mb-14">
            {block.eyebrow && (
              <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-blue-300" : "text-ow-blue"} mb-3 block`}>
                {block.eyebrow}
              </span>
            )}
            {block.heading && (
              <h2 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? "text-white" : "text-gray-900"} leading-tight`}>
                {block.heading}
              </h2>
            )}
            <div className="accent-bar-center accent-bar" />
            {block.subheading && (
              <p className={`text-lg max-w-xl mx-auto ${isDark ? "text-white/60" : "text-gray-500"}`}>
                {block.subheading}
              </p>
            )}
          </div>
        )}
        <div className={`grid ${cols} gap-6 max-w-5xl mx-auto`}>
          {(block.cards || []).map((card: any, i: number) => {
            const cardImage = getMediaUrl(card.image);
            const colorGrad = ICON_COLORS[card.iconColor || "blue"] || ICON_COLORS.blue;
            const inner = (
              <div
                key={i}
                className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl ${cardImage ? "overflow-hidden" : "p-8"} text-center hover:shadow-lg hover:-translate-y-1 ${isDark ? "hover:border-blue-400/30" : "hover:border-ow-blue/20"} transition-all`}
              >
                {cardImage && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={cardImage} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className={cardImage ? "p-6" : ""}>
                  {card.icon && !cardImage && (
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorGrad} text-white flex items-center justify-center mx-auto mb-4`}>
                      <Icon name={card.icon} color={card.iconColor} />
                    </div>
                  )}
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"} mb-2`}>{card.title}</h3>
                  {card.description && (
                    <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>{card.description}</p>
                  )}
                </div>
              </div>
            );
            if (card.href) {
              return <a key={i} href={card.href} className="block no-underline group">{inner}</a>;
            }
            return <div key={i}>{inner}</div>;
          })}
        </div>
        {block.footnote && (
          <p className={`text-center italic mt-10 ${isDark ? "text-white/40" : "text-gray-400"}`}>
            {block.footnote}
          </p>
        )}
      </div>
    </section>
  );
}

function CTARenderer({ block }: { block: any }) {
  if (block.style === "simple") {
    return (
      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          {block.heading && <p className="text-sm text-white/70 font-medium">{block.heading}</p>}
        </div>
      </section>
    );
  }

  if (block.style === "dark") {
    return (
      <section className="bg-ow-navy py-24">
        <div className="ow-container text-center">
          {block.eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">{block.eyebrow}</p>}
          {block.heading && <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-4">{block.heading}</h2>}
          {block.description && <p className="text-base text-white/80 max-w-xl mx-auto mb-8">{block.description}</p>}
          {block.isScheduleReview ? (
            <ScheduleReviewButton className="btn btn-white btn-lg" label={block.buttonLabel || "Schedule Your Review"} />
          ) : block.buttonHref ? (
            <a href={block.buttonHref} className="btn btn-white btn-lg">{block.buttonLabel || "Learn More"}</a>
          ) : null}
        </div>
      </section>
    );
  }

  const bgImage = getMediaUrl(block.backgroundImage) || "/images/testimonial-bg.jpg";
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(135deg, rgba(43,108,176,.92), rgba(30,78,140,.95))" }} />
      <div className="relative z-10 ow-container text-center">
        {block.eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-4">{block.eyebrow}</p>}
        {block.heading && <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-4 leading-tight">{block.heading}</h2>}
        {block.description && <p className="text-base text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">{block.description}</p>}
        {block.isScheduleReview ? (
          <ScheduleReviewButton className="btn btn-white btn-lg" label={block.buttonLabel || "Schedule Your Review"} />
        ) : block.buttonHref ? (
          <a href={block.buttonHref} className="btn btn-white btn-lg">{block.buttonLabel || "Learn More"}</a>
        ) : null}
      </div>
    </section>
  );
}

function TwoLayerModelRenderer({ block }: { block: any }) {
  return (
    <section className="ow-section bg-white">
      <div className="ow-container">
        <div className="text-center mb-14">
          {block.eyebrow && (
            <span className="text-xs font-bold uppercase tracking-widest text-ow-blue mb-3 block">{block.eyebrow}</span>
          )}
          {block.heading && (
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">{block.heading}</h2>
          )}
          <div className="accent-bar-center accent-bar" />
          {block.description && (
            <div className="text-gray-500 text-lg max-w-2xl mx-auto">
              <RichTextContent content={block.description} />
            </div>
          )}
        </div>
        <div className="max-w-3xl mx-auto flex flex-col gap-0">
          {block.layer1 && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-9">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-white bg-ow-blue px-3 py-1 rounded-md mb-3">
                {block.layer1.tag || "Layer 1"}
              </span>
              {block.layer1.title && <h3 className="text-xl font-extrabold text-gray-900 mb-1">{block.layer1.title}</h3>}
              {block.layer1.subtitle && <p className="text-sm text-gray-500 mb-5">{block.layer1.subtitle}</p>}
              {block.layer1.items && block.layer1.items.length > 0 && (
                <ul className="space-y-3">
                  {block.layer1.items.map((item: any, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><path d="M5 13l4 4L19 7" /></svg>
                      <span><strong className="text-gray-900">{item.bold}</strong> {item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex justify-center py-2 text-gray-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
          </div>
          {block.layer2 && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-9">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-white bg-emerald-500 px-3 py-1 rounded-md mb-3">
                {block.layer2.tag || "Layer 2"}
              </span>
              {block.layer2.title && <h3 className="text-xl font-extrabold text-gray-900 mb-1">{block.layer2.title}</h3>}
              {block.layer2.subtitle && <p className="text-sm text-gray-500 mb-5">{block.layer2.subtitle}</p>}
              {block.layer2.description && (
                <div className="text-sm text-gray-700 leading-relaxed mb-5">
                  <RichTextContent content={block.layer2.description} />
                </div>
              )}
              {block.layer2.formula && block.layer2.formula.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap bg-emerald-500/8 rounded-lg px-5 py-3.5 text-sm font-semibold text-emerald-800">
                  {block.layer2.formula.map((f: any, i: number) => (
                    <span key={i}>
                      {i > 0 && <span className="text-emerald-500 text-lg mr-3">&rarr;</span>}
                      {f.step}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LeadMagnetRenderer({ block }: { block: any }) {
  const bookImage = getMediaUrl(block.bookImage) || "/images/ppp-book-cover.png";
  return (
    <section className="relative overflow-hidden py-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#0a1628]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(43,108,176,.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(16,185,129,.08) 0%, transparent 50%)" }} />
      </div>
      <div className="relative z-10 ow-container py-20 lg:py-28">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-center">
          <div>
            {block.badge && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full mb-6">
                {block.badge}
              </span>
            )}
            {block.heading && (
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">{block.heading}</h2>
            )}
            {block.description && (
              <p className="text-lg text-white/70 mb-6 leading-relaxed">{block.description}</p>
            )}
            {block.bulletPoints && block.bulletPoints.length > 0 && (
              <div className="space-y-3 mb-8">
                {block.bulletPoints.map((bp: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm text-white/80">{bp.text}</span>
                  </div>
                ))}
              </div>
            )}
            <LeadMagnetForm />
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-ow-blue/20 to-emerald-500/10 rounded-3xl blur-2xl" />
              <img src={bookImage} alt="Peak Property Performance book" className="relative w-64 lg:w-80 drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQRenderer({ block }: { block: any }) {
  return (
    <section className="ow-section bg-white">
      <div className="ow-container">
        {(block.eyebrow || block.heading) && (
          <div className="section-header">
            {block.eyebrow && <span className="section-eyebrow">{block.eyebrow}</span>}
            {block.heading && <h2 className="section-heading">{block.heading}</h2>}
            <div className="accent-bar-center accent-bar" />
          </div>
        )}
        {(block.groups || []).map((group: any, gi: number) => (
          <div key={gi} className="mb-12">
            {group.groupLabel && (
              <h3 className="text-lg font-bold text-gray-900 mb-4">{group.groupLabel}</h3>
            )}
            <div className="faq-list">
              {(group.items || []).map((item: any, fi: number) => (
                <details key={fi} className="faq-item">
                  <summary>
                    <span className="faq-q">{item.question}</span>
                    <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="faq-a">
                    <RichTextContent content={item.answer} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineRenderer({ block }: { block: any }) {
  const isDark = block.backgroundColor === "dark";
  const bgClass = block.backgroundColor === "gray" ? "bg-gray-50" : isDark ? "bg-ow-navy" : "bg-white";

  return (
    <section className={`ow-section ${bgClass}`}>
      <div className="ow-container">
        {(block.eyebrow || block.heading) && (
          <div className="section-header">
            {block.eyebrow && (
              <span className={`section-eyebrow ${isDark ? "section-eyebrow-light" : ""}`}>{block.eyebrow}</span>
            )}
            {block.heading && (
              <h2 className={`section-heading ${isDark ? "section-heading-light" : ""}`}>{block.heading}</h2>
            )}
            <div className="accent-bar-center accent-bar" />
            {block.subheading && (
              <p className="section-subtitle">{block.subheading}</p>
            )}
          </div>
        )}
        <div className="ppp-timeline">
          {(block.steps || []).map((step: any, i: number) => (
            <div key={i} className={`ppp-step ${step.isActive ? "ppp-step-active" : ""}`}>
              <div className="ppp-step-num">{step.number}</div>
              <div className="ppp-step-body">
                <h3>
                  {step.title}
                  {step.badge && <span className="ppp-badge">{step.badge}</span>}
                </h3>
                {step.description && <p>{step.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeliverablesRenderer({ block }: { block: any }) {
  const bgClass = block.backgroundColor === "gray" ? "bg-gray-50" : "bg-white";
  return (
    <section className={`ow-section ${bgClass}`}>
      <div className="ow-container">
        {(block.eyebrow || block.heading) && (
          <div className="section-header">
            {block.eyebrow && <span className="section-eyebrow">{block.eyebrow}</span>}
            {block.heading && <h2 className="section-heading">{block.heading}</h2>}
            <div className="accent-bar-center accent-bar" />
          </div>
        )}
        <div className="deliverables">
          {(block.items || []).map((item: any, i: number) => (
            <div key={i} className="deliverable">
              <div className="deliverable-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="deliverable-body">
                <h3>{item.title}</h3>
                {item.subtitle && <p className="font-semibold text-gray-700">{item.subtitle}</p>}
                {item.description && <p>{item.description}</p>}
                {item.bulletPoints && item.bulletPoints.length > 0 && (
                  <ul>
                    {item.bulletPoints.map((bp: any, bi: number) => (
                      <li key={bi}>{bp.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RichTextContent({ content }: { content: any }) {
  if (!content) return null;
  if (typeof content === "string") {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  if (content.root && content.root.children) {
    return <LexicalRenderer nodes={content.root.children} />;
  }
  return null;
}

function LexicalRenderer({ nodes }: { nodes: any[] }) {
  if (!nodes) return null;
  return (
    <>
      {nodes.map((node: any, i: number) => (
        <LexicalNode key={i} node={node} />
      ))}
    </>
  );
}

function LexicalNode({ node }: { node: any }) {
  if (!node) return null;

  if (node.type === "text") {
    let el: React.ReactNode = node.text || "";
    if (node.format & 1) el = <strong>{el}</strong>;
    if (node.format & 2) el = <em>{el}</em>;
    if (node.format & 4) el = <s>{el}</s>;
    if (node.format & 8) el = <u>{el}</u>;
    if (node.format & 16) el = <code>{el}</code>;
    return <>{el}</>;
  }

  if (node.type === "linebreak") return <br />;

  if (node.type === "link") {
    return (
      <a href={node.fields?.url || node.url || "#"} target={node.fields?.newTab ? "_blank" : undefined} rel={node.fields?.newTab ? "noopener noreferrer" : undefined}>
        {node.children && <LexicalRenderer nodes={node.children} />}
      </a>
    );
  }

  const children = node.children ? <LexicalRenderer nodes={node.children} /> : null;

  switch (node.type) {
    case "paragraph":
      return <p>{children}</p>;
    case "heading": {
      const tag = node.tag || "h2";
      if (tag === "h1") return <h1>{children}</h1>;
      if (tag === "h3") return <h3>{children}</h3>;
      if (tag === "h4") return <h4>{children}</h4>;
      if (tag === "h5") return <h5>{children}</h5>;
      if (tag === "h6") return <h6>{children}</h6>;
      return <h2>{children}</h2>;
    }
    case "list":
      if (node.listType === "number") return <ol>{children}</ol>;
      return <ul>{children}</ul>;
    case "listitem":
      return <li>{children}</li>;
    case "quote":
      return <blockquote>{children}</blockquote>;
    case "horizontalrule":
      return <hr />;
    default:
      return <div>{children}</div>;
  }
}
