import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { safeDecodeURIComponent } from "@/lib/urlUtils";

export default async function OrgScopedDashboard(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    // Decode the URL-encoded slug safely
    const orgSlug = safeDecodeURIComponent(params.slug);
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    let userName = "User";
    if (session?.user) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('full_name')
			.eq('id', session.user.id)
			.single();
		if (profile?.full_name) userName = profile.full_name;
		else if (session.user.user_metadata?.full_name) userName = session.user.user_metadata.full_name;
		else if (session.user.email) userName = session.user.email.split('@')[0];
	}

    // Fetch real data from database
    
    // Get organization info
    const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

    // Get student count
    const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization?.id);

    // Get application count
    const { count: applicationCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization?.id);

    // Get agencies count
    const { count: agenciesCount } = await supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization?.id);

    // Get webhook settings count
    const { count: webhookCount } = await supabase
        .from('webhook_settings')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization?.id);

    // Get recent students for activity log
    const { data: recentStudents } = await supabase
        .from('students')
        .select('first_name, last_name, created_at')
        .eq('org_id', organization?.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Get recent applications for activity log
    const { data: recentApplications } = await supabase
        .from('applications')
        .select('status, created_at')
        .eq('org_id', organization?.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Get recent agencies for activity log
    const { data: recentAgencies } = await supabase
        .from('agencies')
        .select('name, created_at')
        .eq('org_id', organization?.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Calculate previous period counts for percentage changes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: previousStudentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization?.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

    const { count: previousApplicationCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization?.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

    // Calculate percentage changes
    const studentChange = previousStudentCount ? 
        Math.round(((studentCount || 0) - previousStudentCount) / previousStudentCount * 100) : 0;
    
    const applicationChange = previousApplicationCount ? 
        Math.round(((applicationCount || 0) - previousApplicationCount) / previousApplicationCount * 100) : 0;

    // Webhook logging removed
    const totalWebhookCalls = 0;
    const successfulWebhookCalls = 0;
    const webhookSuccessRate = 0;
    const webhookSuccessChange = 0;

    // Webhook logging removed
    const recentWebhookActivity = [];

    return (
		<div className="space-y-6">
			{/* Dashboard Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
				<p className="text-gray-500 mt-1">Overview of your multitenant webhook system</p>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{/* Total Students */}
				<div className="bg-white rounded-lg p-6 shadow-sm border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Total Students</p>
							<p className="text-2xl font-bold text-gray-900">{studentCount || 0}</p>
							<div className="flex items-center mt-1">
								<span className={`text-sm font-medium ${studentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
									{studentChange >= 0 ? '+' : ''}{studentChange}%
								</span>
								<svg className={`w-4 h-4 ml-1 ${studentChange >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d={studentChange >= 0 ? 
										"M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" :
										"M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
									} clipRule="evenodd" />
								</svg>
							</div>
						</div>
						<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
							</svg>
						</div>
					</div>
				</div>

				{/* Agencies */}
				<div className="bg-white rounded-lg p-6 shadow-sm border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Agencies</p>
							<p className="text-2xl font-bold text-gray-900">{agenciesCount || 0}</p>
							<div className="flex items-center mt-1">
								<span className="text-gray-500 text-sm font-medium">Partners</span>
							</div>
						</div>
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
					</div>
				</div>

				{/* Active Applications */}
				<div className="bg-white rounded-lg p-6 shadow-sm border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Active Applications</p>
							<p className="text-2xl font-bold text-gray-900">{applicationCount || 0}</p>
							<div className="flex items-center mt-1">
								<span className={`text-sm font-medium ${applicationChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
									{applicationChange >= 0 ? '+' : ''}{applicationChange}%
								</span>
								<svg className={`w-4 h-4 ml-1 ${applicationChange >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d={applicationChange >= 0 ? 
										"M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" :
										"M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
									} clipRule="evenodd" />
								</svg>
							</div>
						</div>
						<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
					</div>
				</div>

				{/* Webhook Success Rate */}
				<div className="bg-white rounded-lg p-6 shadow-sm border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Webhook Success Rate</p>
							<p className="text-2xl font-bold text-gray-900">{webhookSuccessRate}%</p>
							<div className="flex items-center mt-1">
								<span className="text-green-600 text-sm font-medium">+{webhookSuccessChange}%</span>
								<svg className="w-4 h-4 text-green-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
								</svg>
							</div>
						</div>
						<div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
					</div>
				</div>

				{/* Webhook Settings */}
				<div className="bg-white rounded-lg p-6 shadow-sm border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Webhook Settings</p>
							<p className="text-2xl font-bold text-gray-900">{webhookCount || 0}</p>
							<div className="flex items-center mt-1">
								<span className="text-gray-500 text-sm font-medium">Configured</span>
							</div>
						</div>
						<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Charts and Recent Events */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Webhook Deliveries Chart */}
				<div className="bg-white rounded-lg p-6 shadow-sm border">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-900">Webhook Deliveries</h3>
						<select className="text-sm border border-gray-300 rounded-md px-2 py-1">
							<option>Last 7 days</option>
							<option>Last 30 days</option>
							<option>Last 90 days</option>
						</select>
					</div>
					<div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
						<div className="text-center">
							<svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
							<p className="text-gray-500">Webhook delivery metrics will appear here</p>
							<p className="text-sm text-gray-400">Configure webhooks to see delivery data</p>
						</div>
					</div>
				</div>

				{/* Recent Events */}
				<div className="bg-white rounded-lg p-6 shadow-sm border">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
					<div className="space-y-3">
						{recentWebhookActivity && recentWebhookActivity.length > 0 ? (
							recentWebhookActivity.map((activity, index) => (
								<div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
									<div className={`w-6 h-6 rounded-full flex items-center justify-center ${
										activity.status === 'success' ? 'bg-green-100' : 
										activity.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
									}`}>
										<svg className={`w-4 h-4 ${
											activity.status === 'success' ? 'text-green-600' : 
											activity.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
										}`} fill="currentColor" viewBox="0 0 20 20">
											{activity.status === 'success' ? (
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											) : activity.status === 'failed' ? (
												<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
											) : (
												<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
											)}
										</svg>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900">
											{activity.table_name} {activity.operation}
										</p>
										<p className="text-xs text-gray-500">{organization?.name || 'Organization'}</p>
									</div>
									<p className="text-xs text-gray-400">
										{activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'Recently'}
									</p>
								</div>
							))
						) : recentStudents && recentStudents.length > 0 ? (
							recentStudents.map((student, index) => (
								<div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
									<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
										<svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900">
											Student: {student.first_name} {student.last_name}
										</p>
										<p className="text-xs text-gray-500">{organization?.name || 'Organization'}</p>
									</div>
									<p className="text-xs text-gray-400">
										{student.created_at ? new Date(student.created_at).toLocaleDateString() : 'Recently'}
									</p>
								</div>
							))
						) : recentAgencies && recentAgencies.length > 0 ? (
							recentAgencies.map((agency, index) => (
								<div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
									<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
										<svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900">
											Agency: {agency.name}
										</p>
										<p className="text-xs text-gray-500">{organization?.name || 'Organization'}</p>
									</div>
									<p className="text-xs text-gray-400">
										{agency.created_at ? new Date(agency.created_at).toLocaleDateString() : 'Recently'}
									</p>
								</div>
							))
						) : (
							<div className="text-center py-8">
								<svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2" />
								</svg>
								<p className="text-gray-500 text-sm">No recent activity</p>
								<p className="text-gray-400 text-xs mt-1">Activity will appear here as users interact with the system</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}


