import Link from "next/link";

interface PillarCardProps {
  number: number;
  title: string;
  description: string;
  href: string;
}

export function PillarCard({
  number,
  title,
  description,
  href,
}: PillarCardProps) {
  return (
    <Link
      href={href}
      className="group ow-card ow-card-hover relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-ow-blue to-ow-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-4">
        <span className="text-3xl font-bold text-ow-blue/20 group-hover:text-ow-blue/40 transition-colors">
          {String(number).padStart(2, "0")}
        </span>
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-ow-blue transition-colors mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
          <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-ow-blue opacity-0 group-hover:opacity-100 transition-opacity">
            Read more
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
