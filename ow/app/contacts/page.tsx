import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ContactsPage() {
  const people = await prisma.person.findMany({
    include: { organization: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <div className="ml-auto text-sm">
          <Link href="/organizations" className="underline">
            Organizations
          </Link>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Organization</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/person/${p.id}`} className="hover:underline">
                    {p.firstName} {p.lastName}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.email ?? "-"}</td>
                <td className="px-3 py-2">
                  {p.organization ? (
                    <Link
                      href={`/organization/${p.organization.id}`}
                      className="hover:underline"
                    >
                      {p.organization.name}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


