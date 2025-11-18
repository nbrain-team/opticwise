import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function NewDealPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/deals/new");

  const pipeline = await prisma.pipeline.findFirst({
    include: { stages: { orderBy: { orderIndex: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  if (!pipeline) {
    return <div className="p-6">No pipeline. Run seed.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Add deal</h1>
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
        action={async (formData: FormData) => {
          "use server";
          const title = String(formData.get("title") || "");
          const value = Number(formData.get("value") || 0);
          const stageId = String(formData.get("stageId") || "");
          const pipelineId = String(formData.get("pipelineId") || "");
          const organizationName = String(formData.get("organizationName") || "");
          const personFirstName = String(formData.get("personFirstName") || "");
          const personLastName = String(formData.get("personLastName") || "");
          const expectedCloseDate = String(formData.get("expectedCloseDate") || "");
          const probability = Number(formData.get("probability") || 0) || undefined;

          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/deals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              value,
              pipelineId,
              stageId,
              organizationName: organizationName || undefined,
              personFirstName: personFirstName || undefined,
              personLastName: personLastName || undefined,
              expectedCloseDate: expectedCloseDate || undefined,
              probability,
            }),
          });

          if (!res.ok) {
            throw new Error("Failed to create deal");
          }
          redirect("/deals");
        }}
      >
        <input type="hidden" name="pipelineId" defaultValue={pipeline.id} />
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            required
            name="title"
            className="w-full border rounded px-3 py-2"
            placeholder="Deal title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Value (USD)</label>
          <input
            name="value"
            type="number"
            className="w-full border rounded px-3 py-2"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Organization</label>
          <input
            name="organizationName"
            className="w-full border rounded px-3 py-2"
            placeholder="Organization name"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium">Person first name</label>
            <input
              name="personFirstName"
              className="w-full border rounded px-3 py-2"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Person last name</label>
            <input
              name="personLastName"
              className="w-full border rounded px-3 py-2"
              placeholder="Last name"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Pipeline stage</label>
          <select name="stageId" className="w-full border rounded px-3 py-2">
            {pipeline.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Probability (%)</label>
          <input
            name="probability"
            type="number"
            min={0}
            max={100}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Expected close date</label>
          <input
            name="expectedCloseDate"
            type="date"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <button className="h-10 px-4 rounded bg-black text-white">Save</button>
        </div>
      </form>
    </div>
  );
}


