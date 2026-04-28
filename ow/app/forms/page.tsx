import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const forms = await prisma.form.findMany({
    include: {
      pipeline: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { submissions: true, fields: true } },
      submissions: {
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  const totalSubmissions = forms.reduce((sum, f) => sum + f._count.submissions, 0);
  const activeForms = forms.filter((f) => f.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Forms</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Forms hosted on opticwise.com that capture leads directly into the CRM.
              Each submission creates a contact + company and a new deal in the
              pipeline you choose.
            </p>
          </div>
          <Link
            href="/forms/new"
            className="bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium whitespace-nowrap"
          >
            + New Form
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Forms" value={forms.length} />
          <StatCard label="Active" value={activeForms} accent="green" />
          <StatCard label="Total Submissions" value={totalSubmissions} accent="blue" />
        </div>

        {forms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-semibold">Form</th>
                  <th className="px-5 py-3 font-semibold">Pipeline → Stage</th>
                  <th className="px-5 py-3 font-semibold">Owner</th>
                  <th className="px-5 py-3 font-semibold">Fields</th>
                  <th className="px-5 py-3 font-semibold">Submissions</th>
                  <th className="px-5 py-3 font-semibold">Last submission</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forms.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/forms/${f.id}`}
                          className="font-semibold text-gray-900 hover:text-[#3B6B8F]"
                        >
                          {f.name}
                        </Link>
                        {!f.isActive && (
                          <span className="inline-block text-[10px] uppercase tracking-wide bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">slug: {f.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {f.pipeline?.name}{" "}
                      <span className="text-gray-400">→</span>{" "}
                      <span className="text-gray-700">{f.stage?.name}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {f.owner?.name || f.owner?.email || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{f._count.fields}</td>
                    <td className="px-5 py-4 text-gray-700">{f._count.submissions}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {f.submissions[0]?.createdAt
                        ? new Date(f.submissions[0].createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <Link
                        href={`/forms/${f.id}/submissions`}
                        className="text-xs text-[#3B6B8F] hover:underline font-medium"
                      >
                        Submissions
                      </Link>
                      <Link
                        href={`/forms/${f.id}`}
                        className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Edit
                      </Link>
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "blue" | "green";
}) {
  const color =
    accent === "green" ? "text-emerald-600" : accent === "blue" ? "text-[#3B6B8F]" : "text-gray-900";
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">No forms yet</h2>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
        Create your first form, then drop the FormEmbed block into any page on opticwise.com
        using the form&apos;s slug.
      </p>
      <Link
        href="/forms/new"
        className="inline-block bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] font-medium"
      >
        + Create your first form
      </Link>
    </div>
  );
}
