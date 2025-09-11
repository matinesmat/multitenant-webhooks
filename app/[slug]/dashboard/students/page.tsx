import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import StudentsClient from "@/components/StudentsClient";
import { safeDecodeURIComponent } from "@/lib/urlUtils";

type Student = {
	id: string;
	org_id: string;
	first_name: string;
	last_name: string;
	email: string | null;
	status: string;
	created_at: string;
	updated_at: string;
	organization_name: string;
	linked_agencies_count: number;
	applications_count: number;
};

type SearchParams = Record<string, string | string[] | undefined>;
const LIST_PATH = (orgId: string) => `/${orgId}/dashboard/students`;

function getPage(sp: SearchParams) {
	const raw = typeof sp.page === "string" ? sp.page : Array.isArray(sp.page) ? sp.page[0] : undefined;
	const p = Number(raw ?? 1);
	return Number.isFinite(p) && p > 0 ? p : 1;
}

function getSearchQuery(sp: SearchParams) {
	return Array.isArray(sp.search) ? sp.search[0] : sp.search || "";
}

export default async function StudentsPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<SearchParams> }) {
	const { slug: encodedSlug } = await params;
	// Decode the URL-encoded slug safely
	const slug = safeDecodeURIComponent(encodedSlug);
	const cookieStore = await cookies();
	const supabase = createServerComponentClient({ cookies: () => cookieStore });
	
	// Get organization info
	const { data: orgData, error: orgError } = await supabase
		.from("organizations")
		.select("id, name")
		.eq("slug", slug)
		.limit(1);
	
	const org = orgData?.[0];
	
	if (orgError) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-red-500 text-center">
					<h2 className="text-xl font-semibold mb-2">Error loading organization</h2>
					<p>Error: {orgError.message}</p>
					<p className="text-sm text-gray-600 mt-2">Slug: {slug}</p>
				</div>
			</div>
		);
	}
	if (!org) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-red-500 text-center">
					<h2 className="text-xl font-semibold mb-2">Organization not found</h2>
					<p>No organization found with slug: {slug}</p>
				</div>
			</div>
		);
	}

	const sp = await searchParams;
	const page = getPage(sp);
	const searchQuery = getSearchQuery(sp);
	const perPage = 10;
	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	// Get students with basic info first
	let query = supabase
		.from("students")
		.select(`
			id,
			org_id,
			first_name,
			last_name,
			email,
			status,
			created_at,
			updated_at
		`, { count: "exact" })
		.eq("org_id", org.id);

	// Apply search filter
	if (searchQuery) {
		query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
	}

	const { data, count, error } = await query
		.order("updated_at", { ascending: false })
		.range(from, to);

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-red-500 text-center">
					<h2 className="text-xl font-semibold mb-2">Error loading students</h2>
					<p>Error: {error.message}</p>
					<p className="text-sm text-gray-600 mt-2">Organization ID: {org.id}</p>
				</div>
			</div>
		);
	}

	// Transform data to include counts and organization name
	const rows: Student[] = (data ?? []).map(student => ({
		id: student.id,
		org_id: student.org_id,
		first_name: student.first_name,
		last_name: student.last_name,
		email: student.email,
		status: student.status || 'active',
		created_at: student.created_at,
		updated_at: student.updated_at,
		organization_name: org.name,
		linked_agencies_count: 0, // TODO: Implement actual count query
		applications_count: 0 // TODO: Implement actual count query
	}));

	const total = count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / perPage));

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
				<StudentsClient
					students={rows}
					total={total}
					from={from}
					to={to}
					totalPages={totalPages}
					currentPage={page}
					searchQuery={searchQuery}
					baseHref={LIST_PATH(slug)}
					organizationSlug={slug}
				/>
			</div>
		</div>
	);
}



