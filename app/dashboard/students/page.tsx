// app/dashboard/students/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import CrudToolbar from "@/components/CrudToolbar";
import { 
  createStudentAction, 
  updateStudentAction, 
  deleteStudentAction 
} from "./actions";

type Student = {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type SearchParams = Record<string, string | string[] | undefined>;
const LIST_PATH = "/dashboard/students";

function getPage(sp: SearchParams) {
  const raw = typeof sp.page === "string" ? sp.page : Array.isArray(sp.page) ? sp.page[0] : undefined;
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
export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = getPage(sp);
  const perPage = 8;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createServerComponentClient({ cookies });
  
  // Fetch students
  const { data, count, error } = await supabase
    .from("students")
    .select("id,org_id,first_name,last_name,email", { count: "exact" })
    .order("id", { ascending: true })
    .range(from, to);

  // Fetch organizations for dropdown
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id,name")
    .order("name");

  const rows = (data ?? []) as Student[];
  const organizations = orgs ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const errorMsg = error?.message ?? null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.2)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Students</h2>

        <CrudToolbar
          createTitle="Add Student"
          updateTitle="Update Student"
          deleteTitle="Delete Student"
          createFields={[
            { name: "first_name", label: "First name", required: true },
            { name: "last_name", label: "Last name", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { 
              name: "org_id", 
              label: "Organization", 
              type: "select", 
              required: true,
              options: organizations.map(org => ({ value: org.id, label: org.name }))
            },
          ]}
          updateFields={[
            { name: "id", label: "ID", placeholder: "student id", required: true },
            { name: "first_name", label: "First name (optional)" },
            { name: "last_name", label: "Last name (optional)" },
            { name: "email", label: "Email (optional)", type: "email" },
            { 
              name: "org_id", 
              label: "Organization (optional)", 
              type: "select",
              placeholder: "Select organization",
              options: organizations.map(org => ({ value: org.id, label: org.name }))
            },
          ]}
          deleteFields={[
            { name: "id", label: "ID", placeholder: "student id", required: true },
          ]}
          onCreateAction={createStudentAction}
          onUpdateAction={updateStudentAction}
          onDeleteAction={deleteStudentAction}
        />
      </div>

      {errorMsg && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
          Could not load students: {errorMsg}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <Th>ID</Th>
              <Th>Organization</Th>
              <Th>First name</Th>
              <Th>Last name</Th>
              <Th>Email</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No data yet
                </td>
              </tr>
            )}
            {rows.map((s) => {
              const org = organizations.find(o => o.id === s.org_id);
              return (
                <tr key={s.id} className="hover:bg-gray-50/60">
                  <Td>{s.id}</Td>
                  <Td>{org ? org.name : s.org_id}</Td>
                  <Td>{s.first_name}</Td>
                  <Td>{s.last_name}</Td>
                  <Td>{s.email}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div>
          Showing {rows.length ? `${from + 1}–${from + rows.length}` : 0} of {total.toLocaleString()} entries
        </div>
        <Pagination baseHref={LIST_PATH} page={page} totalPages={totalPages} />
      </div>
    </section>
  );
}

/* ----------------------------- UI bits ----------------------------- */
function Th({ children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-medium" {...rest}>
      {children}
    </th>
  );
}
function Td({ children, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3" {...rest}>
      {children}
    </td>
  );
}
function Pagination({ baseHref, page, totalPages }: { baseHref: string; page: number; totalPages: number }) {
  const nums = compactRange(page, totalPages);
  const link = (p: number) => `${baseHref}?page=${p}`;
  return (
    <div className="flex items-center gap-1">
      <Link className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50" href={link(Math.max(1, page - 1))} aria-label="Previous page">
        &lt;
      </Link>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <Link
            key={n}
            href={link(n)}
            className={`h-8 rounded-md px-3 text-sm ${n === page ? "bg-[#5A54F9] text-white" : "border bg-white text-gray-700 hover:bg-gray-50"}`}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </Link>
        )
      )}
      <Link className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50" href={link(Math.min(totalPages, page + 1))} aria-label="Next page">
        &gt;
      </Link>
    </div>
  );
}
