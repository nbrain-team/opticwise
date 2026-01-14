'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
}

export function DeleteCampaignDialog({ isOpen, onClose, campaignId, campaignName }: DeleteCampaignDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      router.push('/campaigns');
      router.refresh();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Campaign</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{campaignName}</strong>? This will also delete all associated leads, touchpoints, and analytics data. This action cannot be undone.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Campaign'}
          </button>
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}



