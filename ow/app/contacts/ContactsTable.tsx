"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";

// Define all available columns with sortable flag
const ALL_COLUMNS = [
  { key: "firstName", label: "First Name", default: true, sortable: true },
  { key: "lastName", label: "Last Name", default: true, sortable: true },
  { key: "email", label: "Email", default: true, sortable: true },
  { key: "organization", label: "Organization", default: true, sortable: true },
  { key: "phoneWork", label: "Phone (Work)", default: true, sortable: false },
  { key: "city", label: "City", default: true, sortable: true },
  { key: "state", label: "State", default: true, sortable: true },
  { key: "openDealsCount", label: "Open Deals", default: true, sortable: true },
  { key: "title", label: "Job Title", default: false, sortable: true },
  { key: "phoneMobile", label: "Phone (Mobile)", default: false, sortable: false },
  { key: "phoneHome", label: "Phone (Home)", default: false, sortable: false },
  { key: "emailWork", label: "Email (Work)", default: false, sortable: true },
  { key: "emailHome", label: "Email (Home)", default: false, sortable: true },
  { key: "country", label: "Country", default: false, sortable: true },
  { key: "zipCode", label: "ZIP Code", default: false, sortable: true },
  { key: "postalAddress", label: "Full Address", default: false, sortable: false },
  { key: "contactType", label: "Contact Type", default: false, sortable: true },
  { key: "labels", label: "Labels", default: false, sortable: true },
  { key: "classification", label: "Classification", default: false, sortable: true },
  { key: "linkedInProfile", label: "LinkedIn", default: false, sortable: false },
  { key: "marketingStatus", label: "Marketing Status", default: false, sortable: true },
  { key: "totalActivities", label: "Total Activities", default: false, sortable: true },
  { key: "lastActivityDate", label: "Last Activity", default: false, sortable: true },
  { key: "emailMessagesCount", label: "Email Count", default: false, sortable: true },
  { key: "lastEmailReceived", label: "Last Email Received", default: false, sortable: true },
  { key: "lastEmailSent", label: "Last Email Sent", default: false, sortable: true },
  { key: "wonDeals", label: "Won Deals", default: false, sortable: true },
  { key: "lostDeals", label: "Lost Deals", default: false, sortable: true },
  { key: "birthday", label: "Birthday", default: false, sortable: true },
  { key: "notes", label: "Notes", default: false, sortable: false },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.filter(col => col.default).map(col => col.key);

interface Person {
  id: string;
  name: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  emailWork: string | null;
  emailHome: string | null;
  emailOther: string | null;
  phone: string | null;
  phoneWork: string | null;
  phoneHome: string | null;
  phoneMobile: string | null;
  phoneOther: string | null;
  title: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  postalAddress: string | null;
  contactType: string | null;
  labels: string | null;
  classification: string | null;
  linkedInProfile: string | null;
  marketingStatus: string | null;
  totalActivities: number | null;
  lastActivityDate: string | null;
  emailMessagesCount: number | null;
  lastEmailReceived: string | null;
  lastEmailSent: string | null;
  wonDeals: number | null;
  lostDeals: number | null;
  birthday: string | null;
  notes: string | null;
  openDeals: number | null;
  organization: { id: string; name: string } | null;
  deals: { id: string; status: string }[];
}

interface ContactsTableProps {
  people: Person[];
}

type SortDirection = "asc" | "desc" | null;

export function ContactsTable({ people }: ContactsTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [pendingColumns, setPendingColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>("lastName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Sync pending columns when opening the selector
  useEffect(() => {
    if (showColumnSelector) {
      setPendingColumns(visibleColumns);
    }
  }, [showColumnSelector, visibleColumns]);

  const togglePendingColumn = (key: string) => {
    setPendingColumns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    setPendingColumns(ALL_COLUMNS.map(col => col.key));
  };

  const selectDefaultColumns = () => {
    setPendingColumns(DEFAULT_COLUMNS);
  };

  const applyColumnChanges = () => {
    setVisibleColumns(pendingColumns);
    setShowColumnSelector(false);
  };

  const cancelColumnChanges = () => {
    setPendingColumns(visibleColumns);
    setShowColumnSelector(false);
  };

  const handleSort = (columnKey: string) => {
    const column = ALL_COLUMNS.find(c => c.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const getSortValue = (person: Person, columnKey: string): string | number | null => {
    switch (columnKey) {
      case "firstName":
        return person.firstName?.toLowerCase() || "";
      case "lastName":
        return person.lastName?.toLowerCase() || "";
      case "email":
        return (person.emailWork || person.email)?.toLowerCase() || "";
      case "emailWork":
        return person.emailWork?.toLowerCase() || "";
      case "emailHome":
        return person.emailHome?.toLowerCase() || "";
      case "organization":
        return person.organization?.name?.toLowerCase() || "";
      case "city":
        return person.city?.toLowerCase() || "";
      case "state":
        return person.state?.toLowerCase() || "";
      case "country":
        return person.country?.toLowerCase() || "";
      case "zipCode":
        return person.zipCode || "";
      case "title":
        return person.title?.toLowerCase() || "";
      case "contactType":
        return person.contactType?.toLowerCase() || "";
      case "labels":
        return person.labels?.toLowerCase() || "";
      case "classification":
        return person.classification?.toLowerCase() || "";
      case "marketingStatus":
        return person.marketingStatus?.toLowerCase() || "";
      case "openDealsCount":
        return person.deals.length;
      case "totalActivities":
        return person.totalActivities ?? -1;
      case "emailMessagesCount":
        return person.emailMessagesCount ?? -1;
      case "wonDeals":
        return person.wonDeals ?? -1;
      case "lostDeals":
        return person.lostDeals ?? -1;
      case "lastActivityDate":
        return person.lastActivityDate || "";
      case "lastEmailReceived":
        return person.lastEmailReceived || "";
      case "lastEmailSent":
        return person.lastEmailSent || "";
      case "birthday":
        return person.birthday || "";
      default:
        return "";
    }
  };

  const sortedPeople = useMemo(() => {
    if (!sortColumn || !sortDirection) return people;

    return [...people].sort((a, b) => {
      const aVal = getSortValue(a, sortColumn);
      const bVal = getSortValue(b, sortColumn);

      if (aVal === null || aVal === "") return 1;
      if (bVal === null || bVal === "") return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [people, sortColumn, sortDirection]);

  const renderSortIcon = (columnKey: string) => {
    const column = ALL_COLUMNS.find(c => c.key === columnKey);
    if (!column?.sortable) return null;

    if (sortColumn !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortDirection === "asc") {
      return (
        <svg className="w-4 h-4 text-[#3B6B8F] ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-[#3B6B8F] ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderCellValue = (person: Person, columnKey: string) => {
    switch (columnKey) {
      case "firstName":
        return (
          <Link 
            href={`/person/${person.id}`}
            className="font-medium text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors"
          >
            {person.firstName || "-"}
          </Link>
        );
      case "lastName":
        return (
          <Link 
            href={`/person/${person.id}`}
            className="font-medium text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors"
          >
            {person.lastName || "-"}
          </Link>
        );
      case "email":
        const email = person.emailWork || person.email;
        return email ? (
          <a href={`mailto:${email}`} className="text-[#3B6B8F] hover:underline">
            {email}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "emailWork":
        return person.emailWork ? (
          <a href={`mailto:${person.emailWork}`} className="text-[#3B6B8F] hover:underline">
            {person.emailWork}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "emailHome":
        return person.emailHome ? (
          <a href={`mailto:${person.emailHome}`} className="text-[#3B6B8F] hover:underline">
            {person.emailHome}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "organization":
        return person.organization ? (
          <Link
            href={`/organization/${person.organization.id}`}
            className="text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors"
          >
            {person.organization.name}
          </Link>
        ) : <span className="text-gray-400">-</span>;
      case "phoneWork":
        return person.phoneWork ? (
          <a href={`tel:${person.phoneWork}`} className="text-[#3B6B8F] hover:underline">
            {person.phoneWork}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "phoneMobile":
        return person.phoneMobile ? (
          <a href={`tel:${person.phoneMobile}`} className="text-[#3B6B8F] hover:underline">
            {person.phoneMobile}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "phoneHome":
        return person.phoneHome ? (
          <a href={`tel:${person.phoneHome}`} className="text-[#3B6B8F] hover:underline">
            {person.phoneHome}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "city":
        return <span className="text-gray-600">{person.city || "-"}</span>;
      case "state":
        return <span className="text-gray-600">{person.state || "-"}</span>;
      case "country":
        return <span className="text-gray-600">{person.country || "-"}</span>;
      case "zipCode":
        return <span className="text-gray-600">{person.zipCode || "-"}</span>;
      case "postalAddress":
        return <span className="text-gray-600 text-xs max-w-[200px] truncate block">{person.postalAddress || "-"}</span>;
      case "openDealsCount":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {person.deals.length}
          </span>
        );
      case "title":
        return <span className="text-gray-600">{person.title || "-"}</span>;
      case "contactType":
        return <span className="text-gray-600">{person.contactType || "-"}</span>;
      case "labels":
        return <span className="text-gray-600 text-xs">{person.labels || "-"}</span>;
      case "classification":
        return <span className="text-gray-600">{person.classification || "-"}</span>;
      case "linkedInProfile":
        return person.linkedInProfile ? (
          <a href={person.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-[#3B6B8F] hover:underline text-xs">
            View Profile
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "marketingStatus":
        return <span className="text-gray-600 text-xs">{person.marketingStatus || "-"}</span>;
      case "totalActivities":
        return <span className="text-gray-600">{person.totalActivities ?? "-"}</span>;
      case "lastActivityDate":
        return <span className="text-gray-600 text-xs">{person.lastActivityDate ? new Date(person.lastActivityDate).toLocaleDateString() : "-"}</span>;
      case "emailMessagesCount":
        return <span className="text-gray-600">{person.emailMessagesCount ?? "-"}</span>;
      case "lastEmailReceived":
        return <span className="text-gray-600 text-xs">{person.lastEmailReceived ? new Date(person.lastEmailReceived).toLocaleDateString() : "-"}</span>;
      case "lastEmailSent":
        return <span className="text-gray-600 text-xs">{person.lastEmailSent ? new Date(person.lastEmailSent).toLocaleDateString() : "-"}</span>;
      case "wonDeals":
        return person.wonDeals ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {person.wonDeals}
          </span>
        ) : <span className="text-gray-400">-</span>;
      case "lostDeals":
        return person.lostDeals ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {person.lostDeals}
          </span>
        ) : <span className="text-gray-400">-</span>;
      case "birthday":
        return <span className="text-gray-600 text-xs">{person.birthday ? new Date(person.birthday).toLocaleDateString() : "-"}</span>;
      case "notes":
        return <span className="text-gray-600 text-xs max-w-[150px] truncate block">{person.notes || "-"}</span>;
      default:
        return <span className="text-gray-400">-</span>;
    }
  };

  const hasChanges = JSON.stringify(pendingColumns.sort()) !== JSON.stringify(visibleColumns.sort());

  return (
    <div className="space-y-4">
      {/* Column Selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Columns ({visibleColumns.length}/{ALL_COLUMNS.length})
        </button>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          {sortColumn && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              Sorted by: {ALL_COLUMNS.find(c => c.key === sortColumn)?.label} ({sortDirection})
            </span>
          )}
          <span>Click column headers to sort • Scroll horizontally →</span>
        </div>
      </div>

      {/* Column Selector Dropdown */}
      {showColumnSelector && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3 pb-3 border-b">
            <span className="text-sm font-semibold text-gray-700">Select Columns</span>
            <div className="flex gap-2">
              <button
                onClick={selectAllColumns}
                className="text-xs text-[#3B6B8F] hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={selectDefaultColumns}
                className="text-xs text-[#3B6B8F] hover:underline"
              >
                Reset to Default
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto mb-4">
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={pendingColumns.includes(col.key)}
                  onChange={() => togglePendingColumn(col.key)}
                  className="rounded border-gray-300 text-[#3B6B8F] focus:ring-[#3B6B8F]"
                />
                <span className="text-gray-700">{col.label}</span>
                {col.sortable && (
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                )}
              </label>
            ))}
          </div>
          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-gray-500">
              {pendingColumns.length} columns selected
              {hasChanges && <span className="text-orange-500 ml-2">• Unsaved changes</span>}
            </span>
            <div className="flex gap-2">
              <button
                onClick={cancelColumnChanges}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyColumnChanges}
                className="px-4 py-2 text-sm bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2d5270] transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
              <tr>
                {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                  <th 
                    key={col.key} 
                    className={`text-left px-4 py-3 font-semibold text-[#2E2E2F] whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {renderSortIcon(col.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedPeople.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                  {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {renderCellValue(person, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
              {sortedPeople.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-400">
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
