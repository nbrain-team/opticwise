'use client';

import { useState } from 'react';
import WorkflowBuilder from './WorkflowBuilder';
import CampaignAnalytics from './CampaignAnalytics';
import CampaignLeads from './CampaignLeads';
import { Campaign } from '../types';

type Tab = 'workflow' | 'leads' | 'analytics' | 'settings';

export default function CampaignDetailTabs({ campaign }: { campaign: Campaign }) {
  const [activeTab, setActiveTab] = useState<Tab>('workflow');

  const tabs = [
    { id: 'workflow' as Tab, label: 'Workflow', icon: '🔄' },
    { id: 'leads' as Tab, label: 'Leads', icon: '👥', count: campaign.leads.length },
    { id: 'analytics' as Tab, label: 'Analytics', icon: '📊' },
    { id: 'settings' as Tab, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-[#3B6B8F] text-[#3B6B8F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'workflow' && <WorkflowBuilder campaign={campaign} />}
        {activeTab === 'leads' && <CampaignLeads campaign={campaign} />}
        {activeTab === 'analytics' && <CampaignAnalytics campaign={campaign} />}
        {activeTab === 'settings' && (
          <div className="text-center py-12 text-gray-500">
            Campaign settings coming soon
          </div>
        )}
      </div>
    </div>
  );
}

