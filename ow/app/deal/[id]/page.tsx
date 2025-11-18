import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DealDetail({
  params,
}: {
  params: { id: string };
}) {
  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      person: true,
      owner: true,
      stage: { include: { pipeline: true } },
    },
  });
  if (!deal) {
    return <div className="p-6">Deal not found</div>;
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{deal.title}</h1>
          <div className="text-sm text-gray-600">
            {deal.stage.pipeline.name} • {deal.stage.name}
          </div>
        </div>
        <div className="space-x-2">
          <Link
            href="/deals"
            className="h-9 px-3 rounded border bg-white text-sm inline-flex items-center"
          >
            Back to Deals
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <section className="border rounded-lg bg-white">
            <header className="px-4 py-2 border-b font-medium">Summary</header>
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Value</div>
                <div className="font-medium">
                  {deal.currency} {deal.value.toString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Probability</div>
                <div className="font-medium">
                  {deal.probability ? `${deal.probability}%` : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Expected close date</div>
                <div className="font-medium">
                  {deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString()
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Owner</div>
                <div className="font-medium">{deal.owner.email}</div>
              </div>
            </div>
          </section>
        </div>
        <div className="space-y-4">
          <section className="border rounded-lg bg-white">
            <header className="px-4 py-2 border-b font-medium">Linked</header>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Organization</div>
                <div className="font-medium">
                  {deal.organization ? (
                    <Link
                      href={`/organization/${deal.organization.id}`}
                      className="hover:underline"
                    >
                      {deal.organization.name}
                    </Link>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Person</div>
                <div className="font-medium">
                  {deal.person ? (
                    <Link
                      href={`/person/${deal.person.id}`}
                      className="hover:underline"
                    >
                      {deal.person.firstName} {deal.person.lastName}
                    </Link>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


