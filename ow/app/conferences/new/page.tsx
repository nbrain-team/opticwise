'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewConferencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    venue: '',
    startDate: '',
    endDate: '',
    websiteUrl: '',
    registrationUrl: '',
    boothNumber: '',
    teamMembers: '',
    targetMeetings: 20,
    targetLeads: 50,
    booksToDistribute: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/conferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          teamMembers: formData.teamMembers ? formData.teamMembers.split(',').map(m => m.trim()) : [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conference');
      }

      const { conference } = await response.json();
      router.push(`/conferences/${conference.id}`);
    } catch (error) {
      console.error('Error creating conference:', error);
      alert('Failed to create conference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#3B6B8F] rounded"></div>
                <span className="text-xl font-semibold text-[#50555C]">OpticWise</span>
              </Link>
              <nav className="flex space-x-4">
                <Link href="/conferences" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  ← Back to Conferences
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Conference</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Conference Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Conference Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                placeholder="e.g., CRE Tech Conference 2026"
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
                placeholder="Brief description of the conference and your goals..."
              />
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location (City, State)
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., Las Vegas, NV"
                />
              </div>
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., Mandalay Bay Convention Center"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Conference Website
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label htmlFor="registrationUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Registration URL
                </label>
                <input
                  type="url"
                  id="registrationUrl"
                  value={formData.registrationUrl}
                  onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Booth & Team */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="boothNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Booth Number
                </label>
                <input
                  type="text"
                  id="boothNumber"
                  value={formData.boothNumber}
                  onChange={(e) => setFormData({ ...formData, boothNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., #1234"
                />
              </div>
              <div>
                <label htmlFor="teamMembers" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Members (comma-separated)
                </label>
                <input
                  type="text"
                  id="teamMembers"
                  value={formData.teamMembers}
                  onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., John, Sarah, Mike"
                />
              </div>
            </div>

            {/* Goals */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Goals</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="targetMeetings" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Meetings
                  </label>
                  <input
                    type="number"
                    id="targetMeetings"
                    min="0"
                    value={formData.targetMeetings}
                    onChange={(e) => setFormData({ ...formData, targetMeetings: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="targetLeads" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Leads
                  </label>
                  <input
                    type="number"
                    id="targetLeads"
                    min="0"
                    value={formData.targetLeads}
                    onChange={(e) => setFormData({ ...formData, targetLeads: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="booksToDistribute" className="block text-sm font-medium text-gray-700 mb-2">
                    Books to Distribute
                  </label>
                  <input
                    type="number"
                    id="booksToDistribute"
                    min="0"
                    value={formData.booksToDistribute}
                    onChange={(e) => setFormData({ ...formData, booksToDistribute: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Conference'}
              </button>
              <Link
                href="/conferences"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Next Steps</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• After creating the conference, import the attendee list (CSV)</li>
            <li>• Set up pre-conference email campaigns</li>
            <li>• Track booth visitors and book distribution during the event</li>
            <li>• Launch post-conference follow-up campaigns</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

