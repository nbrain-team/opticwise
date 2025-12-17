"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";

// Define all available columns with sortable flag
const ALL_COLUMNS = [
  { key: "name", label: "Name", default: true, sortable: true },
  { key: "industry", label: "Industry", default: true, sortable: true },
  { key: "city", label: "City", default: true, sortable: true },
  { key: "state", label: "State", default: true, sortable: true },
  { key: "country", label: "Country", default: true, sortable: true },
  { key: "websiteUrl", label: "Website", default: true, sortable: true },
  { key: "peopleCount", label: "People", default: true, sortable: true },
  { key: "openDealsCount", label: "Open Deals", default: true, sortable: true },
  { key: "linkedInProfile", label: "LinkedIn", default: false, sortable: false },
  { key: "numberOfEmployees", label: "Employees", default: false, sortable: true },
  { key: "annualRevenue", label: "Annual Revenue", default: false, sortable: true },
  { key: "doors", label: "Doors", default: false, sortable: true },
  { key: "labels", label: "Labels", default: false, sortable: true },
  { key: "fullAddress", label: "Full Address", default: false, sortable: false },
  { key: "streetAddress", label: "Street", default: false, sortable: true },
  { key: "zipCode", label: "ZIP Code", default: false, sortable: true },
  { key: "district", label: "District", default: false, sortable: true },
  { key: "region", label: "Region", default: false, sortable: true },
  { key: "totalActivities", label: "Total Activities", default: false, sortable: true },
  { key: "doneActivities", label: "Done Activities", default: false, sortable: true },
  { key: "activitiesToDo", label: "Activities To Do", default: false, sortable: true },
  { key: "emailMessagesCount", label: "Email Count", default: false, sortable: true },
  { key: "lastActivityDate", label: "Last Activity", default: false, sortable: true },
  { key: "nextActivityDate", label: "Next Activity", default: false, sortable: true },
  { key: "wonDeals", label: "Won Deals", default: false, sortable: true },
  { key: "lostDeals", label: "Lost Deals", default: false, sortable: true },
  { key: "closedDeals", label: "Closed Deals", default: false, sortable: true },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.filter(col => col.default).map(col => col.key);

interface Organization {
  id: string;
  name: string;
  address: string | null;
  websiteUrl: string | null;
  domain: string | null;
  linkedInProfile: string | null;
  industry: string | null;
  annualRevenue: string | null;
  numberOfEmployees: string | null;
  doors: string | null;
  labels: string | null;
  profilePicture: string | null;
  streetAddress: string | null;
  houseNumber: string | null;
  apartmentSuite: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  country: string | null;
  zipCode: string | null;
  fullAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  openDeals: number | null;
  wonDeals: number | null;
  lostDeals: number | null;
  closedDeals: number | null;
  totalActivities: number | null;
  doneActivities: number | null;
  activitiesToDo: number | null;
  emailMessagesCount: number | null;
  nextActivityDate: string | null;
  lastActivityDate: string | null;
  people: { id: string }[];
  deals: { id: string }[];
}

interface OrganizationsTableProps {
  organizations: Organization[];
}

type SortDirection = "asc" | "desc" | null;

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [pendingColumns, setPendingColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>("name");
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

  const getSortValue = (org: Organization, columnKey: string): string | number | null => {
    switch (columnKey) {
      case "name":
        return org.name?.toLowerCase() || "";
      case "industry":
        return org.industry?.toLowerCase() || "";
      case "city":
        return org.city?.toLowerCase() || "";
      case "state":
        return org.state?.toLowerCase() || "";
      case "country":
        return org.country?.toLowerCase() || "";
      case "websiteUrl":
        return org.domain?.toLowerCase() || org.websiteUrl?.toLowerCase() || "";
      case "numberOfEmployees":
        return org.numberOfEmployees || "";
      case "annualRevenue":
        return org.annualRevenue || "";
      case "doors":
        return org.doors || "";
      case "labels":
        return org.labels?.toLowerCase() || "";
      case "streetAddress":
        return org.streetAddress?.toLowerCase() || "";
      case "zipCode":
        return org.zipCode || "";
      case "district":
        return org.district?.toLowerCase() || "";
      case "region":
        return org.region?.toLowerCase() || "";
      case "peopleCount":
        return org.people.length;
      case "openDealsCount":
        return org.deals.length;
      case "totalActivities":
        return org.totalActivities ?? -1;
      case "doneActivities":
        return org.doneActivities ?? -1;
      case "activitiesToDo":
        return org.activitiesToDo ?? -1;
      case "emailMessagesCount":
        return org.emailMessagesCount ?? -1;
      case "wonDeals":
        return org.wonDeals ?? -1;
      case "lostDeals":
        return org.lostDeals ?? -1;
      case "closedDeals":
        return org.closedDeals ?? -1;
      case "lastActivityDate":
        return org.lastActivityDate || "";
      case "nextActivityDate":
        return org.nextActivityDate || "";
      default:
        return "";
    }
  };

  const sortedOrganizations = useMemo(() => {
    if (!sortColumn || !sortDirection) return organizations;

    return [...organizations].sort((a, b) => {
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
  }, [organizations, sortColumn, sortDirection]);

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

  const renderCellValue = (org: Organization, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <Link 
            href={`/organization/${org.id}`}
            className="font-medium text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors"
          >
            {org.name}
          </Link>
        );
      case "industry":
        return <span className="text-gray-600">{org.industry || "-"}</span>;
      case "city":
        return <span className="text-gray-600">{org.city || "-"}</span>;
      case "state":
        return <span className="text-gray-600">{org.state || "-"}</span>;
      case "country":
        return <span className="text-gray-600">{org.country || "-"}</span>;
      case "websiteUrl":
        return org.websiteUrl ? (
          <a 
            href={org.websiteUrl.startsWith('http') ? org.websiteUrl : `https://${org.websiteUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#3B6B8F] hover:underline inline-flex items-center gap-1"
          >
            <span className="max-w-[150px] truncate">{org.domain || org.websiteUrl}</span>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "linkedInProfile":
        return org.linkedInProfile ? (
          <a 
            href={org.linkedInProfile} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#3B6B8F] hover:underline inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        ) : <span className="text-gray-400">-</span>;
      case "numberOfEmployees":
        return <span className="text-gray-600">{org.numberOfEmployees || "-"}</span>;
      case "annualRevenue":
        return <span className="text-gray-600">{org.annualRevenue || "-"}</span>;
      case "doors":
        return <span className="text-gray-600">{org.doors || "-"}</span>;
      case "labels":
        return <span className="text-gray-600 text-xs">{org.labels || "-"}</span>;
      case "fullAddress":
        return <span className="text-gray-600 text-xs max-w-[200px] truncate block">{org.fullAddress || org.address || "-"}</span>;
      case "streetAddress":
        return <span className="text-gray-600">{org.streetAddress || "-"}</span>;
      case "zipCode":
        return <span className="text-gray-600">{org.zipCode || "-"}</span>;
      case "district":
        return <span className="text-gray-600">{org.district || "-"}</span>;
      case "region":
        return <span className="text-gray-600">{org.region || "-"}</span>;
      case "peopleCount":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {org.people.length}
          </span>
        );
      case "openDealsCount":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {org.deals.length}
          </span>
        );
      case "totalActivities":
        return <span className="text-gray-600">{org.totalActivities ?? "-"}</span>;
      case "doneActivities":
        return <span className="text-gray-600">{org.doneActivities ?? "-"}</span>;
      case "activitiesToDo":
        return <span className="text-gray-600">{org.activitiesToDo ?? "-"}</span>;
      case "emailMessagesCount":
        return <span className="text-gray-600">{org.emailMessagesCount ?? "-"}</span>;
      case "lastActivityDate":
        return <span className="text-gray-600 text-xs">{org.lastActivityDate ? new Date(org.lastActivityDate).toLocaleDateString() : "-"}</span>;
      case "nextActivityDate":
        return <span className="text-gray-600 text-xs">{org.nextActivityDate ? new Date(org.nextActivityDate).toLocaleDateString() : "-"}</span>;
      case "wonDeals":
        return org.wonDeals ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {org.wonDeals}
          </span>
        ) : <span className="text-gray-400">-</span>;
      case "lostDeals":
        return org.lostDeals ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {org.lostDeals}
          </span>
        ) : <span className="text-gray-400">-</span>;
      case "closedDeals":
        return <span className="text-gray-600">{org.closedDeals ?? "-"}</span>;
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
              {sortedOrganizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {renderCellValue(org, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
              {sortedOrganizations.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-400">
                    No organizations found
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





