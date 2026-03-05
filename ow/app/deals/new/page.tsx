import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getActivePipeline } from "@/lib/pipeline";
import { toInt, toDecimal, toDateOrNull } from "@/lib/api-sanitize";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/deals/new");

  const params = await searchParams;
  const pipelineId = params.pipeline as string | undefined;

  let pipeline;
  if (pipelineId) {
    pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: { stages: { orderBy: { orderIndex: "asc" } } },
    });
  }
  if (!pipeline) {
    pipeline = await getActivePipeline();
  }
  if (!pipeline || pipeline.stages.length === 0) {
    return <div className="p-6">No pipeline found. Go to Settings to create one.</div>;
  }

  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const people = await prisma.person.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-light text-[#50555C] mb-6">Add Deal</h1>
      <form
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5"
        action={async (formData: FormData) => {
          "use server";
          const sess = await getSession();
          if (!sess) redirect("/login?next=/deals/new");

          const title = String(formData.get("title") || "").trim();
          if (!title) throw new Error("Title is required");

          const pipelineId = String(formData.get("pipelineId") || "");
          const stageId = String(formData.get("stageId") || "");
          const organizationId = formData.get("organizationId") as string || null;
          const personId = formData.get("personId") as string || null;

          const maxPos = await prisma.deal.aggregate({
            where: { stageId, pipelineId },
            _max: { position: true },
          });

          const deal = await prisma.deal.create({
            data: {
              title,
              value: toDecimal(formData.get("value")) ?? 0,
              currency: "USD",
              pipelineId,
              stageId,
              position: (maxPos._max.position ?? 0) + 1,
              organizationId: organizationId || null,
              personId: personId || null,
              ownerId: sess.userId,
              expectedCloseDate: toDateOrNull(formData.get("expectedCloseDate")),
              probability: toInt(formData.get("probability")),
            },
          });

          redirect(`/deal/${deal.id}`);
        }}
      >
        <input type="hidden" name="pipelineId" defaultValue={pipeline.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Title <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              placeholder="Deal title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value (USD)</label>
            <input
              name="value"
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Stage</label>
            <select name="stageId" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent">
              {pipeline.stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <select name="organizationId" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent">
              <option value="">No organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <select name="personId" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent">
              <option value="">No contact person</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
            <input
              name="probability"
              type="number"
              min={0}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
            <input
              name="expectedCloseDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] transition-colors">
            Create Deal
          </button>
        </div>
      </form>
    </div>
  );
}
