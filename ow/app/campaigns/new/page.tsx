'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    goalType: 'demo_booked',
    goalTarget: 10,
    startDate: '',
    endDate: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const { campaign } = await response.json();
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Note: Using layout.tsx navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/campaigns" className="text-[#3B6B8F] hover:text-[#2E5570] text-sm font-medium">
          ← Back to Campaigns
        </Link>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                placeholder="e.g., Q1 2026 Outbound Campaign"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                placeholder="Describe the campaign goals and target audience..."
              />
            </div>

            {/* Campaign Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Type *
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              >
                <option value="email">Email Campaign</option>
                <option value="multi-channel">Multi-Channel Campaign</option>
                <option value="conference">Conference Campaign</option>
                <option value="book-distribution">Book Distribution</option>
                <option value="nurture">Nurture Sequence</option>
              </select>
            </div>

            {/* Goal Type */}
            <div>
              <label htmlFor="goalType" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Goal
              </label>
              <select
                id="goalType"
                value={formData.goalType}
                onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              >
                <option value="demo_booked">Demo Booked</option>
                <option value="audit_requested">Audit Requested</option>
                <option value="deal_created">Deal Created</option>
                <option value="meeting_scheduled">Meeting Scheduled</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>

            {/* Goal Target */}
            <div>
              <label htmlFor="goalTarget" className="block text-sm font-medium text-gray-700 mb-2">
                Goal Target (number of conversions)
              </label>
              <input
                type="number"
                id="goalTarget"
                min="1"
                value={formData.goalTarget}
                onChange={(e) => setFormData({ ...formData, goalTarget: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                placeholder="e.g., outbound, cold-email, Q1-2026"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
              <Link
                href="/campaigns"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Getting Started</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• After creating the campaign, you can add leads and configure workflows</li>
            <li>• Email campaigns support automated sequences with delays and conditionals</li>
            <li>• Multi-channel campaigns can include email, SMS, voicemail, and LinkedIn</li>
            <li>• Conference campaigns help manage pre/post-event outreach</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

