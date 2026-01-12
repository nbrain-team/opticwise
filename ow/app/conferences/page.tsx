import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import prisma from '@/lib/db';
import { format } from 'date-fns';

export default async function ConferencesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const conferences = await prisma.conference.findMany({
    include: {
      _count: {
        select: {
          attendees: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  const upcomingConferences = conferences.filter(c => c.status === 'upcoming');
  const activeConferences = conferences.filter(c => c.status === 'active');
  const completedConferences = conferences.filter(c => c.status === 'completed');

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
                <Link href="/campaigns" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Campaigns
                </Link>
                <Link href="/conferences" className="text-[#3B6B8F] font-medium px-3 py-2 border-b-2 border-[#3B6B8F]">
                  Conferences
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
              <h1 className="text-3xl font-bold text-gray-900">Conference Campaigns</h1>
              <p className="mt-2 text-gray-600">
                Manage event marketing, attendee outreach, and follow-up campaigns
              </p>
            </div>
            <Link
              href="/conferences/new"
              className="bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
            >
              + New Conference
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Conferences</div>
            <div className="text-3xl font-bold text-gray-900">{conferences.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Upcoming</div>
            <div className="text-3xl font-bold text-blue-600">{upcomingConferences.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-600">{activeConferences.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Attendees</div>
            <div className="text-3xl font-bold text-purple-600">
              {conferences.reduce((sum, c) => sum + c._count.attendees, 0)}
            </div>
          </div>
        </div>

        {/* Conferences List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Conferences</h2>
          </div>
          
          {conferences.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conferences yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first conference event</p>
              <Link
                href="/conferences/new"
                className="inline-block bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
              >
                Add Conference
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conferences.map((conference) => (
                <Link
                  key={conference.id}
                  href={`/conferences/${conference.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{conference.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          conference.status === 'active' ? 'bg-green-100 text-green-800' :
                          conference.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {conference.status}
                        </span>
                      </div>
                      {conference.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">{conference.description}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>📍 {conference.location || 'Location TBD'}</span>
                        <span>📅 {format(new Date(conference.startDate), 'MMM dd, yyyy')}</span>
                        {conference.endDate && (
                          <span>→ {format(new Date(conference.endDate), 'MMM dd, yyyy')}</span>
                        )}
                        <span>👥 {conference._count.attendees} attendees</span>
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

        {/* Conference Campaign Playbook */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Conference Campaign Playbook</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-semibold text-blue-900 mb-2">1. Pre-Conference (2-4 weeks before)</div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Import attendee list</li>
                <li>• Send introduction emails</li>
                <li>• Offer free book</li>
                <li>• Schedule booth meetings</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-purple-900 mb-2">2. During Conference</div>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Track booth visitors</li>
                <li>• Distribute books</li>
                <li>• Collect contact info</li>
                <li>• Schedule follow-ups</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-green-900 mb-2">3. Post-Conference (1-2 weeks after)</div>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• "Nice to meet you" emails</li>
                <li>• "Didn't connect" outreach</li>
                <li>• Book follow-up sequence</li>
                <li>• Schedule demos/audits</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

