import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function InsightsListPage() {
  const insights = await prisma.insight.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#2E2E2F]">Insights</h1>
          <p className="text-sm text-gray-500 mt-1">
            Draft, schedule, and publish to opticwise.com
          </p>
        </div>
        <Link
          href="/insights/new"
          className="rounded-lg bg-[#3B6B8F] text-white px-4 py-2 text-sm font-medium hover:bg-[#2E5570]"
        >
          New insight
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Scheduled</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {insights.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/insights/${row.id}`}
                    className="text-[#3B6B8F] font-medium hover:underline"
                  >
                    {row.title || "(no title)"}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.slug}</td>
                <td className="px-4 py-3 capitalize text-gray-800">{row.status}</td>
                <td className="px-4 py-3 text-gray-600">
                  {row.scheduledFor
                    ? row.scheduledFor.toISOString().slice(0, 16).replace("T", " ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {row.updatedAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {insights.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No insights yet.</p>
        ) : null}
      </div>
    </div>
  );
}
