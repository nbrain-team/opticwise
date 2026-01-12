'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Campaign, CampaignLead } from '../types';

export default function CampaignAnalytics({ campaign }: { campaign: Campaign }) {
  // Calculate metrics from campaign data
  const leads = campaign.leads || [];
  const analytics = campaign.analytics || [];

  // Lead Status Distribution
  const statusData = [
    { name: 'New', value: leads.filter((l: CampaignLead) => l.status === 'new').length, color: '#3B82F6' },
    { name: 'Contacted', value: leads.filter((l: CampaignLead) => l.status === 'contacted').length, color: '#8B5CF6' },
    { name: 'Engaged', value: leads.filter((l: CampaignLead) => l.status === 'engaged').length, color: '#F59E0B' },
    { name: 'Qualified', value: leads.filter((l: CampaignLead) => l.status === 'qualified').length, color: '#10B981' },
    { name: 'Converted', value: leads.filter((l: CampaignLead) => l.status === 'converted').length, color: '#3B6B8F' },
  ];

  // Lead Score Distribution
  const scoreRanges = [
    { name: '0-20', count: leads.filter((l: CampaignLead) => l.leadScore >= 0 && l.leadScore < 20).length },
    { name: '20-40', count: leads.filter((l: CampaignLead) => l.leadScore >= 20 && l.leadScore < 40).length },
    { name: '40-60', count: leads.filter((l: CampaignLead) => l.leadScore >= 40 && l.leadScore < 60).length },
    { name: '60-80', count: leads.filter((l: CampaignLead) => l.leadScore >= 60 && l.leadScore < 80).length },
    { name: '80-100', count: leads.filter((l: CampaignLead) => l.leadScore >= 80 && l.leadScore <= 100).length },
  ];

  // Email Performance
  const totalEmailsSent = leads.reduce((sum: number, l: CampaignLead) => sum + (l.emailsSent || 0), 0);
  const totalEmailsOpened = leads.reduce((sum: number, l: CampaignLead) => sum + (l.emailsOpened || 0), 0);
  const totalEmailsClicked = leads.reduce((sum: number, l: CampaignLead) => sum + (l.emailsClicked || 0), 0);
  const totalEmailsReplied = leads.reduce((sum: number, l: CampaignLead) => sum + (l.emailsReplied || 0), 0);

  const openRate = totalEmailsSent > 0 ? ((totalEmailsOpened / totalEmailsSent) * 100).toFixed(1) : '0';
  const clickRate = totalEmailsSent > 0 ? ((totalEmailsClicked / totalEmailsSent) * 100).toFixed(1) : '0';
  const replyRate = totalEmailsSent > 0 ? ((totalEmailsReplied / totalEmailsSent) * 100).toFixed(1) : '0';

  // Conversion Funnel
  const funnelData = [
    { stage: 'Total Leads', count: leads.length },
    { stage: 'Contacted', count: leads.filter((l: CampaignLead) => l.status !== 'new').length },
    { stage: 'Engaged', count: leads.filter((l: CampaignLead) => ['engaged', 'qualified', 'converted'].includes(l.status)).length },
    { stage: 'Qualified', count: leads.filter((l: CampaignLead) => ['qualified', 'converted'].includes(l.status)).length },
    { stage: 'Converted', count: leads.filter((l: CampaignLead) => l.status === 'converted').length },
  ];

  // Time series data (if analytics exist)
  const timeSeriesData = analytics.slice(0, 30).reverse().map((a) => ({
    date: format(new Date(a.date), 'MMM dd'),
    leads: a.leadsAdded || 0,
    qualified: a.qualified || 0,
    converted: a.dealsCreated || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Open Rate</div>
          <div className="text-3xl font-bold text-blue-900">{openRate}%</div>
          <div className="text-xs text-blue-600 mt-1">{totalEmailsOpened} / {totalEmailsSent} emails</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Click Rate</div>
          <div className="text-3xl font-bold text-purple-900">{clickRate}%</div>
          <div className="text-xs text-purple-600 mt-1">{totalEmailsClicked} / {totalEmailsSent} emails</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Reply Rate</div>
          <div className="text-3xl font-bold text-green-900">{replyRate}%</div>
          <div className="text-xs text-green-600 mt-1">{totalEmailsReplied} / {totalEmailsSent} emails</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-600 font-medium mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold text-orange-900">
            {leads.length > 0 ? ((leads.filter((l: CampaignLead) => l.status === 'converted').length / leads.length) * 100).toFixed(1) : '0'}%
          </div>
          <div className="text-xs text-orange-600 mt-1">
            {leads.filter((l: CampaignLead) => l.status === 'converted').length} / {leads.length} leads
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Score Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreRanges}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B6B8F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#3B6B8F">
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${210 - index * 15}, 70%, ${50 + index * 5}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Time Series (if data exists) */}
      {timeSeriesData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} name="Leads Added" />
              <Line type="monotone" dataKey="qualified" stroke="#10B981" strokeWidth={2} name="Qualified" />
              <Line type="monotone" dataKey="converted" stroke="#3B6B8F" strokeWidth={2} name="Converted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Metrics Table */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="text-sm text-gray-600">Total Emails Sent</div>
            <div className="text-2xl font-bold text-gray-900">{totalEmailsSent}</div>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <div className="text-sm text-gray-600">Emails Opened</div>
            <div className="text-2xl font-bold text-gray-900">{totalEmailsOpened}</div>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="text-sm text-gray-600">Links Clicked</div>
            <div className="text-2xl font-bold text-gray-900">{totalEmailsClicked}</div>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <div className="text-sm text-gray-600">Replies Received</div>
            <div className="text-2xl font-bold text-gray-900">{totalEmailsReplied}</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Reports</h3>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
            📊 Export to CSV
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
            📈 Generate Report
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
            📧 Email Report
          </button>
        </div>
      </div>
    </div>
  );
}

