'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DeleteCampaignDialog } from './DeleteCampaignDialog';

interface CampaignActionsProps {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
}

export function CampaignActions({ campaignId, campaignName, campaignStatus }: CampaignActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign status');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update campaign status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Status Actions */}
        {campaignStatus === 'draft' && (
          <button
            onClick={() => handleStatusChange('active')}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {updating ? 'Activating...' : 'Activate Campaign'}
          </button>
        )}
        
        {campaignStatus === 'active' && (
          <button
            onClick={() => handleStatusChange('paused')}
            disabled={updating}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50"
          >
            {updating ? 'Pausing...' : 'Pause Campaign'}
          </button>
        )}
        
        {campaignStatus === 'paused' && (
          <button
            onClick={() => handleStatusChange('active')}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {updating ? 'Resuming...' : 'Resume Campaign'}
          </button>
        )}

        {/* Edit Button */}
        <Link
          href={`/campaigns/${campaignId}/edit`}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
        >
          Edit
        </Link>

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
        >
          Delete
        </button>
      </div>

      <DeleteCampaignDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        campaignId={campaignId}
        campaignName={campaignName}
      />
    </>
  );
}


