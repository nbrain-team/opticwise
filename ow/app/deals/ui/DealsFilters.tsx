"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface DealsFiltersProps {
  users: Array<{ id: string; email: string; name: string | null }>;
  currentOwner: string;
  currentSort: string;
}

export default function DealsFilters({ users, currentOwner, currentSort }: DealsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOwnerChange = (newOwner: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("owner", newOwner);
    router.push(`/deals?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`/deals?${params.toString()}`);
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      <label className="mr-2 text-sm text-gray-600">Owner</label>
      <select
        name="owner"
        value={currentOwner}
        className="border rounded px-2 py-1 text-sm"
        onChange={(e) => handleOwnerChange(e.target.value)}
      >
        <option value="everyone">Everyone</option>
        {users.map((u) => (
          <option key={u.id} value={u.email}>
            {u.name || u.email}
          </option>
        ))}
      </select>

      <label className="mr-2 text-sm text-gray-600">Sort by</label>
      <select
        name="sort"
        value={currentSort}
        className="border rounded px-2 py-1 text-sm"
        onChange={(e) => handleSortChange(e.target.value)}
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
    </div>
  );
}

