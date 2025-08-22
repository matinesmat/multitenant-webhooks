import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function OrgScopedDashboard(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const supabase = createServerComponentClient({ cookies });

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

    const base = `/${params.slug}/dashboard`;

    return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-white shadow-sm border-b">
				<div className="mx-auto max-w-7xl px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
							<p className="text-gray-600 mt-1">Welcome back, {userName}! 👋</p>
						</div>
					</div>
				</div>
			</div>

			<div className="p-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<Link href={`${base}/organizations`} className="group">
							<div className="rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md group-hover:scale-105">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
									<svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
								</div>
								<h3 className="mb-2 text-lg font-semibold text-gray-900">Organizations</h3>
								<p className="text-sm text-gray-600">Manage your organizations and their settings</p>
							</div>
						</Link>
						<Link href={`${base}/students`} className="group">
							<div className="rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md group-hover:scale-105">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
									<svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
									</svg>
								</div>
								<h3 className="mb-2 text-lg font-semibold text-gray-900">Students</h3>
								<p className="text-sm text-gray-600">Manage student records and information</p>
							</div>
						</Link>
						<Link href={`${base}/webhooks`} className="group">
							<div className="rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md group-hover:scale-105">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
									<svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<h3 className="mb-2 text-lg font-semibold text-gray-900">Webhooks</h3>
								<p className="text-sm text-gray-600">Configure webhook endpoints and settings</p>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}


