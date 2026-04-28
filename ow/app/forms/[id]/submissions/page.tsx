import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const form = await prisma.form.findUnique({
    where: { id },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!form) notFound();

  const submissions = await prisma.formSubmission.findMany({
    where: { formId: id },
    include: {
      person: { select: { id: true, firstName: true, lastName: true, email: true } },
      organization: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = {
    total: submissions.length,
    processed: submissions.filter((s) => s.status === "processed").length,
    failed: submissions.filter((s) => s.status === "failed").length,
    spam: submissions.filter((s) => s.status === "spam").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            href={`/forms/${form.id}`}
            className="text-[#3B6B8F] hover:text-[#2E5570] text-sm font-medium"
          >
            ← Back to {form.name}
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{form.name} — Submissions</h1>
          <p className="text-sm text-gray-600 mt-1">
            slug: <code className="font-mono text-xs">{form.slug}</code> · showing latest 200
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Total" value={counts.total} />
          <Stat label="Processed" value={counts.processed} accent="green" />
          <Stat label="Failed" value={counts.failed} accent="red" />
          <Stat label="Spam" value={counts.spam} accent="amber" />
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No submissions yet. Once visitors fill out the form on opticwise.com, you&apos;ll see them here.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Deal</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={s.status} />
                      {s.errorMessage && (
                        <div className="text-[11px] text-red-600 mt-1 max-w-xs">
                          {s.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.person ? (
                        <Link
                          href={`/person/${s.person.id}`}
                          className="text-[#3B6B8F] hover:underline font-medium"
                        >
                          {[s.person.firstName, s.person.lastName].filter(Boolean).join(" ") ||
                            s.person.email}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      {s.person?.email && (
                        <div className="text-xs text-gray-500">{s.person.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.organization ? (
                        <Link
                          href={`/organization/${s.organization.id}`}
                          className="text-[#3B6B8F] hover:underline"
                        >
                          {s.organization.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.deal ? (
                        <Link
                          href={`/deal/${s.deal.id}`}
                          className="text-[#3B6B8F] hover:underline"
                        >
                          {s.deal.title}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {s.utmSource && (
                        <div>
                          <span className="text-gray-400">utm_source:</span> {s.utmSource}
                        </div>
                      )}
                      {s.utmCampaign && (
                        <div>
                          <span className="text-gray-400">utm_campaign:</span> {s.utmCampaign}
                        </div>
                      )}
                      {!s.utmSource && !s.utmCampaign && (
                        <span className="text-gray-400">direct</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "red" | "amber";
}) {
  const color =
    accent === "green"
      ? "text-emerald-600"
      : accent === "red"
        ? "text-red-600"
        : accent === "amber"
          ? "text-amber-600"
          : "text-gray-900";
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    processed: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
    spam: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
