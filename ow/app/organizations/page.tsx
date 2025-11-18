import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function OrganizationsPage() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <div className="ml-auto text-sm">
          <Link href="/contacts" className="underline">
            People
          </Link>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Website</th>
              <th className="text-left px-3 py-2">Address</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/organization/${o.id}`} className="hover:underline">
                    {o.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{o.websiteUrl ?? "-"}</td>
                <td className="px-3 py-2">{o.address ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


