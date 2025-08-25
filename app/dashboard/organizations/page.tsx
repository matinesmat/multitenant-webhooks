// app/dashboard/organizations/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import CrudToolbar from "@/components/CrudToolbar";
import { 
  createOrganizationAction, 
  updateOrganizationAction, 
  deleteOrganizationAction 
} from "./actions";

type Org = { slug: string; name: string; owner_id: string | null }; // Use slug instead of id
type SearchParams = Record<string, string | string[] | undefined>;

const LIST_PATH = "/dashboard/organizations";

function getPage(sp: SearchParams) {
  const raw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const p = Number(raw ?? 1);
  return Number.isFinite(p) && p > 0 ? p : 1;
}

function compactRange(page: number, total: number) {
  const w = 2;
  const r: (number | "…")[] = [];
  const push = (n: number | "…") => r[r.length - 1] !== n && r.push(n);
  for (let i = 1; i <= total; i++) {
    const edge = i <= 1 || i > total - 1;
    const win = Math.abs(i - page) <= w;
    if (edge || win) push(i);
    else if (r[r.length - 1] !== "…") push("…");
  }
  return r;
}

/* ----------------------------- Page ----------------------------- */
export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = searchParams ?? {};
  const page = getPage(sp);
  const perPage = 8;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createServerComponentClient({ cookies });
  const { data, count, error } = await supabase
    .from("organizations")
    .select("slug,name,owner_id", { count: "exact" }) // Use slug
    .order("slug") // Order by slug
    .range(from, to);

  const rows = (data ?? []) as Org[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const errorMsg = error?.message ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
              <p className="mt-2 text-gray-600">Manage your organizations and their settings</p>
            </div>
            <Link 
              href="/dashboard" 
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">All Organizations</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {total} organization{total !== 1 ? 's' : ''} total
                </p>
              </div>

              <CrudToolbar
                createTitle="Add Organization"
                updateTitle="Update Organization"
                deleteTitle="Delete Organization"
                createFields={[
                  { name: "name", label: "Organization Name", placeholder: "Acme Inc.", required: true },
                  { name: "slug", label: "Slug", placeholder: "unique-slug", required: true }, // Add slug field
                ]}
                updateFields={[
                  { name: "slug", label: "Organization Slug", placeholder: "organization-slug", required: true }, // Use slug
                  { name: "name", label: "New Name (optional)", placeholder: "New organization name" },
                ]}
                deleteFields={[
                  { name: "slug", label: "Organization Slug", placeholder: "organization-slug", required: true }, // Use slug
                ]}
                onCreateAction={createOrganizationAction}
                onUpdateAction={updateOrganizationAction}
                onDeleteAction={deleteOrganizationAction}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="mx-6 mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-800">
              <div className="flex">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Could not load organizations</h3>
                  <div className="mt-2 text-sm">{errorMsg}</div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <Th>Organization Name</Th>
                  <Th>Slug</Th> {/* Display slug */}
                  <Th>Owner ID</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">No organizations yet</p>
                        <p className="text-gray-500 mb-4">Get started by creating your first organization</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>
                            💡 Tip:
                          </span>
                          <span>
                            Use the &quot;Add&quot; button above to create your first organization
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {rows.map((org) => (
                  <tr key={org.slug}> {/* Use slug as key */}
                    <td className="p-4 text-gray-900">{org.name}</td>
                    <td className="p-4 text-gray-500">{org.slug}</td> {/* Display slug */}
                    <td className="p-4 text-gray-500">{org.owner_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <div>
                Showing {rows.length ? `${from + 1}–${from + rows.length}` : 0} of{" "}
                            {total.toLocaleString()} entries
              </div>
              <Pagination baseHref={LIST_PATH} page={page} totalPages={totalPages} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- UI bits ----------------------------- */
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-6 py-4 font-medium text-gray-900">{children}</th>;
}

// Removed unused Td component

function Pagination({
  baseHref,
  page,
  totalPages,
}: {
  baseHref: string;
  page: number;
  totalPages: number;
}) {
  const nums = compactRange(page, totalPages);
  const link = (p: number) => `${baseHref}?page=${p}`;
  return (
    <div className="flex items-center gap-1">
      <Link
        className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        href={link(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        &lt;
      </Link>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={link(n)}
            className={`h-8 rounded-md px-3 text-sm transition-colors ${
              n === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </Link>
        )
      )}
      <Link
        className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        href={link(Math.min(totalPages, page + 1))}
        aria-label="Next page"
      >
        &gt;
      </Link>
    </div>
  );
}
