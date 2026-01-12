"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditOrganizationModal } from "./EditOrganizationModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface OrganizationActionsProps {
  organization: {
    id: string;
    name: string;
    people?: unknown[];
    deals?: unknown[];
    [key: string]: unknown;
  };
}

export function OrganizationActions({ organization }: OrganizationActionsProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete organization");
      }

      // Redirect to organizations page after successful delete
      router.push("/organizations");
      router.refresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const peopleCount = organization.people?.length || 0;
  const dealCount = organization.deals?.length || 0;
  const warningMessage = (peopleCount > 0 || dealCount > 0)
    ? `This organization has ${peopleCount} contact(s) and ${dealCount} deal(s). They will remain but will no longer be linked to this organization.`
    : undefined;

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setShowEditModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Organization
        </button>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>

      <EditOrganizationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        organization={organization}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Organization?"
        message="Are you sure you want to delete this organization? This action cannot be undone."
        itemName={organization.name}
        warningMessage={warningMessage}
      />
    </>
  );
}



