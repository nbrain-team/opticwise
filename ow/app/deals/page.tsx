import { prisma } from "@/lib/db";
import Link from "next/link";
import DealsBoard from "./ui/DealsBoard";
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
    deals: deals.filter((d) => d.stageId === s.id).sort((a, b) => a.position - b.position),
  }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Deals</h1>
        <div className="ml-auto flex items-center gap-2">
          <form>
            <label className="mr-2 text-sm text-gray-600">Owner</label>
            <select
              name="owner"
              defaultValue={owner}
              className="border rounded px-2 py-1 text-sm"
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                params.set("owner", e.target.value);
                window.location.search = params.toString();
              }}
            >
              <option value="everyone">Everyone</option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.email}
                </option>
              ))}
            </select>
          </form>
          <form>
            <label className="mr-2 text-sm text-gray-600">Sort by</label>
            <select
              name="sort"
              defaultValue={sort}
              className="border rounded px-2 py-1 text-sm"
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                params.set("sort", e.target.value);
                window.location.search = params.toString();
              }}
            >
              <option value="title">Deal title</option>
              <option value="value">Deal value</option>
              <option value="person">Linked person</option>
              <option value="organization">Linked organization</option>
              <option value="expectedCloseDate">Expected close date</option>
              <option value="createdAt">Deal created</option>
              <option value="updatedAt">Deal update time</option>
              <option value="owner">Owner name</option>
            </select>
          </form>
          <Link
            href="/deals/new"
            className="h-9 px-3 rounded bg-black text-white flex items-center text-sm"
          >
            + Deal
          </Link>
        </div>
      </div>
      <DealsBoard pipelineId={pipeline.id} columns={grouped} />
    </div>
  );
}


