import { prisma } from "@/lib/db";
import Link from "next/link";

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

export default async function SalesInboxPage() {
  const threads = await prisma.emailThread.findMany({
    include: { messages: true, deal: true, person: true, organization: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  const selected = threads[0] ?? null;
  return (
    <div className="h-[calc(100vh-80px)] grid grid-cols-3">
      <aside className="border-r overflow-y-auto">
        <div className="p-3 border-b font-medium">Sales Inbox</div>
        {threads.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No threads yet.</div>
        ) : (
          <ul>
            {threads.map((t) => (
              <li key={t.id} className="border-b p-3">
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs text-gray-600">
                  {t.person?.firstName} {t.person?.lastName} •{" "}
                  {t.organization?.name ?? "-"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <main className="col-span-2">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-medium">{selected?.subject ?? "No selection"}</div>
          {selected?.deal ? (
            <Link
              href={`/deal/${selected.dealId}`}
              className="text-sm underline"
            >
              View deal
            </Link>
          ) : null}
        </div>
        <div className="p-4 space-y-4">
          {selected?.messages.map((m) => (
            <article key={m.id} className="border rounded p-3 bg-white">
              <div className="text-xs text-gray-600">
                {m.direction} • {new Date(m.sentAt).toLocaleString()}
              </div>
              <div
                className="prose prose-sm mt-2"
                dangerouslySetInnerHTML={{ __html: m.body }}
              />
            </article>
          )) ?? <div className="text-sm text-gray-600">No messages.</div>}
        </div>
      </main>
    </div>
  );
}


