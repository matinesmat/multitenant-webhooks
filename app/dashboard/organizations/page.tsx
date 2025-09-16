// app/dashboard/organizations/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import OrganizationsClient from "@/components/OrganizationsClient";

type Org = { 
  id: string; 
  slug: string; 
  name: string; 
  owner_id: string | null; 
  owner_email: string | null;
  created_at?: string;
};
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

  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Get user session for owner_id
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data, count, error } = await supabase
    .from("organizations")
    .select("id,slug,name,owner_id,owner_email,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = (data ?? []) as Org[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const errorMsg = error?.message ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-8 py-6">
        <OrganizationsClient
          organizations={rows}
          total={total}
          from={from}
          to={to}
          totalPages={totalPages}
          currentPage={page}
          searchQuery=""
          baseHref={LIST_PATH}
        />
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
