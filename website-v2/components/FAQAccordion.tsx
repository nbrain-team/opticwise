"use client";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export function FAQAccordion({ items, className = "" }: FAQAccordionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, idx) => (
        <details
          key={idx}
          className="group ow-card border-gray-200 hover:border-ow-blue/20 transition-colors"
        >
          <summary className="flex items-center justify-between gap-4 cursor-pointer py-1">
            <span className="font-semibold text-gray-900 text-sm lg:text-base pr-4">
              {item.question}
            </span>
            <svg
              className="faq-chevron w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="pt-3 pb-1 text-gray-600 text-sm lg:text-base leading-relaxed border-t border-gray-100 mt-3">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
