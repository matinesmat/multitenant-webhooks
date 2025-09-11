// app/[slug]/dashboard/organizations/page.tsx
import OrganizationsClient from "@/components/OrganizationsClient";
import { safeDecodeURIComponent } from "@/lib/urlUtils";
import { createServerSupabaseClient } from "@/lib/supabase";

type Org = { 
	id: string; 
	name: string; 
	owner_id: string | null; 
	owner_email: string | null;
	slug: string;
	created_at: string;
	students_count: number;
	agencies_count: number;
	status: 'active' | 'pending';
};
type SearchParams = Record<string, string | string[] | undefined>;

const LIST_PATH = (orgId: string) => `/${orgId}/dashboard/organizations`;

function getPage(sp: SearchParams) {
	const raw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
	const p = Number(raw ?? 1);
	return Number.isFinite(p) && p > 0 ? p : 1;
}

function getSearchQuery(sp: SearchParams) {
	return Array.isArray(sp.search) ? sp.search[0] : sp.search || "";
}


/* ----------------------------- Page ----------------------------- */
export default async function OrganizationsPage({
	params,
	searchParams,
}: {
	params: { slug: string };
	searchParams?: SearchParams;
}) {
	// Decode the URL-encoded slug safely
	const slug = safeDecodeURIComponent(params.slug);
	const sp = searchParams ?? {}; // Next.js 15 passes searchParams as an object, not a Promise
	const page = getPage(sp);
	const searchQuery = getSearchQuery(sp);
	const perPage = 10;
	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	const supabase = await createServerSupabaseClient();
	
	// Get organizations with counts and owner info
	let query = supabase
		.from("organizations")
		.select(`
			id,
			name,
			owner_id,
			owner_email,
			slug,
			students:students(count),
			agencies:agencies(count)
		`, { count: "exact" });

	// Apply search filter
	if (searchQuery) {
		query = query.or(`name.ilike.%${searchQuery}%,owner_email.ilike.%${searchQuery}%`);
	}

	// Get organizations data
	const { data, count, error } = await query
		.order("id", { ascending: false })
		.range(from, to);

	// Transform data to include counts and status
	const rows: Org[] = (data ?? []).map(org => ({
		id: org.id,
		name: org.name,
		owner_id: org.owner_id,
		owner_email: org.owner_email,
		slug: org.slug,
		created_at: (org as { created_at?: string }).created_at || new Date().toISOString(),
		students_count: org.students?.[0]?.count || 0,
		agencies_count: org.agencies?.[0]?.count || 0,
		status: org.owner_id ? 'active' : 'pending' as 'active' | 'pending'
	}));

	const total = count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const errorMsg = error?.message ?? null;

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
				{errorMsg && (
					<div className="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
						<div className="flex">
							<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							<div className="ml-3">
								<h3 className="text-sm font-medium">Could not load organizations</h3>
								<div className="mt-2 text-sm">{errorMsg}</div>
							</div>
						</div>
					</div>
				)}
				
				<OrganizationsClient
					organizations={rows}
					total={total}
					from={from}
					to={to}
					totalPages={totalPages}
					currentPage={page}
					searchQuery={searchQuery}
					baseHref={LIST_PATH(slug)}
				/>
			</div>
		</div>
	);
}



