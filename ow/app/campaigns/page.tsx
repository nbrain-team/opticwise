import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import prisma from '@/lib/db';

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Fetch campaigns
  const campaigns = await prisma.campaign.findMany({
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          leads: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#3B6B8F] rounded"></div>
                <span className="text-xl font-semibold text-[#50555C]">OpticWise</span>
              </Link>
              <nav className="flex space-x-4">
                <Link href="/deals" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Deals
                </Link>
                <Link href="/contacts" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Contacts
                </Link>
                <Link href="/organizations" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Organizations
                </Link>
                <Link href="/campaigns" className="text-[#3B6B8F] font-medium px-3 py-2 border-b-2 border-[#3B6B8F]">
                  Campaigns
                </Link>
                <Link href="/ownet-agent" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  🧠 OWnet Agent
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketing Campaigns</h1>
              <p className="mt-2 text-gray-600">
                Manage your multi-channel marketing campaigns and track performance
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
            >
              + New Campaign
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Campaigns</div>
            <div className="text-3xl font-bold text-gray-900">{campaigns.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active Campaigns</div>
            <div className="text-3xl font-bold text-green-600">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Leads</div>
            <div className="text-3xl font-bold text-gray-900">
              {campaigns.reduce((sum, c) => sum + c._count.leads, 0)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Draft Campaigns</div>
            <div className="text-3xl font-bold text-gray-500">
              {campaigns.filter(c => c.status === 'draft').length}
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Campaigns</h2>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first marketing campaign</p>
              <Link
                href="/campaigns/new"
                className="inline-block bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
              >
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
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
                    </div>
                    <div className="ml-4">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/audit-requests" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#3B6B8F] transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Audit Requests</h3>
            <p className="text-sm text-gray-600">View and manage interactive audit tool submissions</p>
          </Link>
          <Link href="/book-requests" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#3B6B8F] transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📚 Book Requests</h3>
            <p className="text-sm text-gray-600">Track book distribution and engagement</p>
          </Link>
          <Link href="/chatbot-conversations" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#3B6B8F] transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💬 Chatbot Leads</h3>
            <p className="text-sm text-gray-600">Review website chatbot conversations and qualified leads</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

