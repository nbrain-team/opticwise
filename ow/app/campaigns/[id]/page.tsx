import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import CampaignDetailTabs from './CampaignDetailTabs';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      leads: {
        take: 100,
        orderBy: {
          enrolledAt: 'desc',
        },
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      sequences: true,
      analytics: {
        orderBy: {
          date: 'desc',
        },
        take: 30,
      },
    },
  });

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <Link href="/campaigns" className="text-[#3B6B8F] hover:underline">
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Note: Using layout.tsx navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/campaigns" className="text-[#3B6B8F] hover:text-[#2E5570] text-sm font-medium">
          ← Back to Campaigns
        </Link>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
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
                <p className="text-gray-600 mb-4">{campaign.description}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Owner: {campaign.owner?.name || campaign.owner?.email}</span>
                <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                {campaign.startDate && (
                  <span>Starts {new Date(campaign.startDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/campaigns/${campaign.id}/edit`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Edit
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Leads</div>
            <div className="text-3xl font-bold text-gray-900">{campaign.leads.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Qualified Leads</div>
            <div className="text-3xl font-bold text-green-600">
              {campaign.leads.filter(l => l.status === 'qualified').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Converted</div>
            <div className="text-3xl font-bold text-blue-600">
              {campaign.leads.filter(l => l.status === 'converted').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Avg Lead Score</div>
            <div className="text-3xl font-bold text-purple-600">
              {campaign.leads.length > 0
                ? Math.round(campaign.leads.reduce((sum, l) => sum + l.leadScore, 0) / campaign.leads.length)
                : 0}
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <CampaignDetailTabs campaign={campaign} />
      </main>
    </div>
  );
}

