"use client";

import Link from "next/link";
import { useState } from "react";

// Define all available columns
const ALL_COLUMNS = [
  { key: "firstName", label: "First Name", default: true },
  { key: "lastName", label: "Last Name", default: true },
  { key: "email", label: "Email", default: true },
  { key: "organization", label: "Organization", default: true },
  { key: "phoneWork", label: "Phone (Work)", default: true },
  { key: "city", label: "City", default: true },
  { key: "state", label: "State", default: true },
  { key: "openDealsCount", label: "Open Deals", default: true },
  { key: "title", label: "Job Title", default: false },
  { key: "phoneMobile", label: "Phone (Mobile)", default: false },
  { key: "phoneHome", label: "Phone (Home)", default: false },
  { key: "emailWork", label: "Email (Work)", default: false },
  { key: "emailHome", label: "Email (Home)", default: false },
  { key: "country", label: "Country", default: false },
  { key: "zipCode", label: "ZIP Code", default: false },
  { key: "postalAddress", label: "Full Address", default: false },
  { key: "contactType", label: "Contact Type", default: false },
  { key: "labels", label: "Labels", default: false },
  { key: "classification", label: "Classification", default: false },
  { key: "linkedInProfile", label: "LinkedIn", default: false },
  { key: "marketingStatus", label: "Marketing Status", default: false },
  { key: "totalActivities", label: "Total Activities", default: false },
  { key: "lastActivityDate", label: "Last Activity", default: false },
  { key: "emailMessagesCount", label: "Email Count", default: false },
  { key: "lastEmailReceived", label: "Last Email Received", default: false },
  { key: "lastEmailSent", label: "Last Email Sent", default: false },
  { key: "wonDeals", label: "Won Deals", default: false },
  { key: "lostDeals", label: "Lost Deals", default: false },
  { key: "birthday", label: "Birthday", default: false },
  { key: "notes", label: "Notes", default: false },
];

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

export function ContactsTable({ people }: ContactsTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter(col => col.default).map(col => col.key)
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS.map(col => col.key));
  };

  const selectDefaultColumns = () => {
    setVisibleColumns(ALL_COLUMNS.filter(col => col.default).map(col => col.key));
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
        <div className="text-xs text-gray-500">
          Scroll horizontally to see all columns →
        </div>
      </div>

      {/* Column Selector Dropdown */}
      {showColumnSelector && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded border-gray-300 text-[#3B6B8F] focus:ring-[#3B6B8F]"
                />
                <span className="text-gray-700">{col.label}</span>
              </label>
            ))}
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
                  <th key={col.key} className="text-left px-4 py-3 font-semibold text-[#2E2E2F] whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                  {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {renderCellValue(person, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
              {people.length === 0 && (
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

