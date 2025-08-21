import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createOrganizationFromForm } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SelectOrganizationPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const supabase = createServerComponentClient({ cookies });
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { data: orgs } = await supabase
		.from("organizations")
		.select("id,name,slug") // Include slug
		.eq("owner_id", user.id)
		.order("name");

    const organizations = orgs ?? [];

    const sp = (await searchParams) ?? {};
    const createOpen = (Array.isArray(sp.create) ? sp.create[0] : sp.create) === "1";

	return (
		<div className="mx-auto max-w-2xl p-6 sm:p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Your Organizations</h1>
				<Link
					href={createOpen ? "/select-organization" : "/select-organization?create=1"}
					className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-xl leading-none hover:bg-gray-50"
					aria-label="Create organization"
				>
					+
				</Link>
			</div>

			{/* Organization cards */}
			<div className="space-y-3">
				{organizations.map((o) => (
					<Link
						key={o.slug || o.id} // Use slug if available, fallback to id
						href={`/${o.slug}/dashboard/students`}
						className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:shadow-md"
					>
						<div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-400">●</div>
								<div className="min-w-0">
									<div className="truncate font-medium text-gray-900">{o.name}</div>
									<div className="truncate text-sm text-gray-500">{o.slug}</div>
								</div>
						<div className="ml-auto text-gray-400">›</div>
					</Link>
				))}
				{organizations.length === 0 && (
					<div className="rounded-xl border border-dashed p-6 text-center text-gray-500">No organizations yet</div>
				)}
			</div>

			{/* Create new organization modal */}
			{createOpen && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
					<form
						action={createOrganizationFromForm}
						className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
					>
						<div className="flex items-center justify-between">
							<h3 className="text-base font-semibold">Create organization</h3>
							<Link
								href="/select-organization"
								className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
								aria-label="Close"
							>
								Close
							</Link>
						</div>

						<label className="block text-sm">
							<span className="mb-1 block text-gray-600">ID</span>
							<input name="id" placeholder="Leave blank to auto-generate" className="w-full rounded-md border px-3 py-2" />
						</label>

						<label className="block text-sm">
							<span className="mb-1 block text-gray-600">Owner ID</span>
							<input name="owner_id" defaultValue={user.id} className="w-full rounded-md border px-3 py-2" readOnly />
						</label>

						<label className="block text-sm">
							<span className="mb-1 block text-gray-600">Name</span>
							<input name="name" required placeholder="Organization name" className="w-full rounded-md border px-3 py-2" />
						</label>

						<label className="block text-sm">
							<span className="mb-1 block text-gray-600">Slug</span>
							<input name="slug" required placeholder="Unique slug" className="w-full rounded-md border px-3 py-2" />
						</label>

						<label className="block text-sm">
							<span className="mb-1 block text-gray-600">Photo</span>
							<input name="photo" type="file" accept="image/*" className="w-full rounded-md border px-3 py-2" />
						</label>

						<div className="flex justify-end gap-2 pt-2">
							<Link href="/select-organization" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Cancel</Link>
							<button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white">Create</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}


