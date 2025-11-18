import { prisma } from "@/lib/db";

export default async function OrganizationDetail({
  params,
}: {
  params: { id: string };
}) {
  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: { people: true, deals: true },
  });
  if (!org) return <div className="p-6">Organization not found</div>;
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{org.name}</h1>
        <div className="text-sm text-gray-600">{org.address ?? "-"}</div>
      </div>
      <section className="border rounded-lg bg-white">
        <header className="px-4 py-2 border-b font-medium">Details</header>
        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Website</div>
            <div className="font-medium">{org.websiteUrl ?? "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Domain</div>
            <div className="font-medium">{org.domain ?? "-"}</div>
          </div>
        </div>
      </section>
    </div>
  );
}


