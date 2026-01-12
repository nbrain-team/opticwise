'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CampaignLeads({ campaign }: { campaign: any }) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');

  const leads = campaign.leads || [];

  // Filter leads
  const filteredLeads = leads.filter((lead: any) => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a: any, b: any) => {
    if (sortBy === 'score') return b.leadScore - a.leadScore;
    if (sortBy === 'recent') return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    if (sortBy === 'engagement') return (b.emailsOpened + b.emailsClicked) - (a.emailsOpened + a.emailsClicked);
    return 0;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      engaged: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      converted: 'bg-[#3B6B8F] text-white',
      unsubscribed: 'bg-red-100 text-red-800',
      bounced: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            >
              <option value="all">All Leads ({leads.length})</option>
              <option value="new">New ({leads.filter((l: any) => l.status === 'new').length})</option>
              <option value="contacted">Contacted ({leads.filter((l: any) => l.status === 'contacted').length})</option>
              <option value="engaged">Engaged ({leads.filter((l: any) => l.status === 'engaged').length})</option>
              <option value="qualified">Qualified ({leads.filter((l: any) => l.status === 'qualified').length})</option>
              <option value="converted">Converted ({leads.filter((l: any) => l.status === 'converted').length})</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            >
              <option value="score">Lead Score</option>
              <option value="recent">Most Recent</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
        </div>
        <button className="px-4 py-2 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] transition-colors font-medium">
          + Add Leads
        </button>
      </div>

      {/* Leads Table */}
      {sortedLeads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
          <p className="text-gray-600 mb-6">Add leads to this campaign to start tracking their progress</p>
          <button className="px-6 py-3 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] transition-colors font-medium">
            Add Your First Lead
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedLeads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.firstName && lead.lastName
                              ? `${lead.firstName} ${lead.lastName}`
                              : lead.email}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          {lead.company && (
                            <div className="text-xs text-gray-400">{lead.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-bold ${getScoreColor(lead.leadScore)}`}>
                          {lead.leadScore}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>📧 {lead.emailsSent} sent, {lead.emailsOpened} opened</div>
                        <div>🔗 {lead.emailsClicked} clicked, {lead.emailsReplied} replied</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {lead.person && (
                          <Link
                            href={`/person/${lead.person.id}`}
                            className="text-[#3B6B8F] hover:text-[#2E5570]"
                          >
                            View
                          </Link>
                        )}
                        {lead.convertedToDealId && (
                          <Link
                            href={`/deal/${lead.convertedToDealId}`}
                            className="text-green-600 hover:text-green-700"
                          >
                            Deal
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {sortedLeads.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bulk Actions</h3>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm">
              Export Selected
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm">
              Change Status
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm">
              Send Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

