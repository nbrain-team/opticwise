import { prisma } from "@/lib/db";

export default async function PersonDetail({ params }: { params: { id: string } }) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: { organization: true, deals: true },
  });
  if (!person) return <div className="p-6">Person not found</div>;
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {person.firstName} {person.lastName}
        </h1>
        <div className="text-sm text-gray-600">{person.organization?.name ?? "-"}</div>
      </div>
      <section className="border rounded-lg bg-white">
        <header className="px-4 py-2 border-b font-medium">Details</header>
        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Email</div>
            <div className="font-medium">{person.email ?? "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Phone</div>
            <div className="font-medium">{person.phone ?? "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Title</div>
            <div className="font-medium">{person.title ?? "-"}</div>
          </div>
        </div>
      </section>
    </div>
  );
}


