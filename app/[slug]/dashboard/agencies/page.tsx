import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import AgencyActionsDropdown from "@/components/AgencyActionsDropdown";

export default async function AgenciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  // Get agencies
  const { data: agencies } = await supabase
    .from('agencies')
    .select(`
      *,
      agency_student(count),
      applications(count)
    `)
    .eq('org_id', organization?.id)
    .order('name');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agencies</h1>
          <p className="text-gray-600 mt-1">Manage partner agencies and their connections</p>
        </div>
        <Link
          href={`/${slug}/dashboard/agencies/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Agency
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Agencies</h2>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search agencies..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900">Name</th>
                <th className="px-6 py-3 font-medium text-gray-900">Contact</th>
                <th className="px-6 py-3 font-medium text-gray-900 text-center">Students</th>
                <th className="px-6 py-3 font-medium text-gray-900 text-center">Applications</th>
                <th className="px-6 py-3 font-medium text-gray-900 text-center">Status</th>
                <th className="px-6 py-3 font-medium text-gray-900">Last Activity</th>
                <th className="px-6 py-3 font-medium text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agencies?.map((agency) => (
                <tr key={agency.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{agency.name}</div>
                      <div className="text-sm text-gray-500">{agency.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900">{agency.email}</div>
                      <div className="text-sm text-gray-500">{agency.phone || 'No phone'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {agency.agency_student?.[0]?.count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {agency.applications?.[0]?.count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {agency.updated_at ? new Date(agency.updated_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AgencyActionsDropdown agencyId={agency.id} slug={slug} />
                  </td>
                </tr>
              ))}

              {(!agencies || agencies.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">No agencies yet</p>
                      <p className="text-gray-500 mb-4">Get started by adding your first agency partnership</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
