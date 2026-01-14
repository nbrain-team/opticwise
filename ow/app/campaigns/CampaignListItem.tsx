'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DeleteCampaignDialog } from '../components/DeleteCampaignDialog';

interface CampaignListItemProps {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    type: string;
    createdAt: Date;
    owner: {
      name: string | null;
      email: string;
    } | null;
    _count: {
      leads: number;
    };
  };
}

export default function CampaignListItem({ campaign }: CampaignListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className="block px-6 py-4 hover:bg-gray-50 transition-colors group">
        <div className="flex items-center justify-between">
          <Link href={`/campaigns/${campaign.id}`} className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {campaign.status}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {campaign.type}
              </span>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-1">{campaign.description}</p>
            )}
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>{campaign._count.leads} leads</span>
              {campaign.owner && <span>Owner: {campaign.owner.name || campaign.owner.email}</span>}
              <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
          <div className="ml-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/campaigns/${campaign.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-700"
            >
              Edit
            </Link>
            <button
              onClick={handleDeleteClick}
              className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <DeleteCampaignDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        campaignId={campaign.id}
        campaignName={campaign.name}
      />
    </>
  );
}

