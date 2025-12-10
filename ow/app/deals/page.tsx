import { prisma } from "@/lib/db";
import Link from "next/link";
import DealsBoard from "./ui/DealsBoard";
import DealsFilters from "./ui/DealsFilters";
import { getSession } from "@/lib/session";

type SortKey =
  | "nextActivity" // placeholder for future parity
  | "title"
  | "value"
  | "person"
  | "organization"
  | "expectedCloseDate"
  | "createdAt"
  | "updatedAt"
  | "owner";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const params = await searchParams;
  const owner = (params.owner as string) || "everyone";
  const sort = ((params.sort as SortKey) || "title") as SortKey;
  const statusFilter = (params.status as string) || "open";

  const pipeline = await prisma.pipeline.findFirst({
    include: {
      stages: {
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!pipeline) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Deals</h1>
        <p className="text-sm text-gray-600 mt-2">
          No pipeline found. Run the database seed.
        </p>
        <Link className="text-sm underline" href="/login">
          Go to login
        </Link>
      </div>
    );
  }

  const whereOwner =
    owner === "everyone"
      ? {}
      : {
          owner: {
            email: owner,
          },
        };

  const orderBy =
    sort === "title"
      ? [{ title: "asc" } as const]
      : sort === "value"
      ? [{ value: "desc" } as const]
      : sort === "organization"
      ? [{ organization: { name: "asc" } } as const]
      : sort === "person"
      ? [{ person: { lastName: "asc" } } as const]
      : sort === "expectedCloseDate"
      ? [{ expectedCloseDate: "asc" } as const]
      : sort === "createdAt"
      ? [{ addTime: "desc" } as const]
      : sort === "updatedAt"
      ? [{ updateTime: "desc" } as const]
      : sort === "owner"
      ? [{ owner: { email: "asc" } } as const]
      : [{ position: "asc" } as const];

  const deals = await prisma.deal.findMany({
    where: {
      pipelineId: pipeline.id,
      status: statusFilter as "open" | "won" | "lost",
      ...whereOwner,
    },
    include: {
      organization: true,
      person: true,
      owner: true,
      stage: true,
    },
    orderBy,
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  });

  const grouped = pipeline.stages.map((s) => ({
    stage: s,
    deals: deals
      .filter((d) => d.stageId === s.id)
      .sort((a, b) => a.position - b.position)
      .map((deal) => ({
        ...deal,
        value: deal.value.toNumber(),
        addTime: deal.addTime.toISOString(),
        updateTime: deal.updateTime.toISOString(),
        stageChangeTime: deal.stageChangeTime.toISOString(),
        expectedCloseDate: deal.expectedCloseDate?.toISOString() || null,
      })),
  }));

  // Count deals by status
  const openCount = await prisma.deal.count({
    where: { pipelineId: pipeline.id, status: "open", ...whereOwner },
  });
  const wonCount = await prisma.deal.count({
    where: { pipelineId: pipeline.id, status: "won", ...whereOwner },
  });
  const lostCount = await prisma.deal.count({
    where: { pipelineId: pipeline.id, status: "lost", ...whereOwner },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-light text-[#50555C]">Deals</h1>
        <DealsFilters users={users} currentOwner={owner} currentSort={sort} />
        <Link
          href="/deals/new"
          className="btn-primary ml-2"
        >
          + Deal
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <Link
          href={`/deals?status=open&owner=${owner}&sort=${sort}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "open"
              ? "border-[#3B6B8F] text-[#3B6B8F]"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Open ({openCount})
        </Link>
        <Link
          href={`/deals?status=won&owner=${owner}&sort=${sort}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "won"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Won ({wonCount})
        </Link>
        <Link
          href={`/deals?status=lost&owner=${owner}&sort=${sort}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "lost"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Lost ({lostCount})
        </Link>
      </div>

      {/* Show board for open deals, list for won/lost */}
      {statusFilter === "open" ? (
        <DealsBoard pipelineId={pipeline.id} columns={grouped} />
      ) : (
        <div className="space-y-2">
          {deals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No {statusFilter} deals found.</p>
            </div>
          ) : (
            deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deal/${deal.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{deal.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        statusFilter === "won" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {statusFilter.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {deal.organization?.name || "No organization"} • {deal.stage.name}
                    </div>
                    {deal.lostReason && statusFilter === "lost" && (
                      <div className="text-sm text-gray-500 mt-1">
                        Reason: {deal.lostReason}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-[#3B6B8F]">
                      {deal.currency} {deal.value.toNumber().toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {statusFilter === "won" && deal.wonTime
                        ? `Won ${new Date(deal.wonTime).toLocaleDateString()}`
                        : statusFilter === "lost" && deal.lostTime
                        ? `Lost ${new Date(deal.lostTime).toLocaleDateString()}`
                        : ""}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}


