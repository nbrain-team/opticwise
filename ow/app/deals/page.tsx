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
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const owner = (searchParams.owner as string) || "everyone";
  const sort = ((searchParams.sort as SortKey) || "title") as SortKey;

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
      status: "open",
      ...whereOwner,
    },
    include: {
      organization: true,
      person: true,
      owner: true,
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
        expectedCloseDate: deal.expectedCloseDate?.toISOString() || null,
      })),
  }));

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
      <DealsBoard pipelineId={pipeline.id} columns={grouped} />
    </div>
  );
}


