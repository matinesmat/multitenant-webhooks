// app/dashboard/webhooks/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import * as React from "react";
import CrudToolbar from "@/components/CrudToolbar";
import { 
  createWebhookAction, 
  updateWebhookAction, 
  deleteWebhookAction 
} from "./actions";

const WEBHOOK_EVENT_OPTIONS = [
  { value: 'student.created', label: 'Student Created' },
  { value: 'student.updated', label: 'Student Updated' },
  { value: 'student.deleted', label: 'Student Deleted' },
];

type Webhook = {
  id: string;
  org_id: string | null;
  name: string;
  url: string;
  bearer_token: string | null;
  json_body: string | null;
  event_type: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const LIST_PATH = "/dashboard/webhooks";

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
export default async function WebhooksPage({
  searchParams,
}: {
  // Next.js 15: searchParams is async in Server Components
  searchParams: SearchParams;
}) {
  const sp = await searchParams; // ✅ await before use
  const page = getPage(sp);
  const perPage = 8;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createServerComponentClient({ cookies });
  const { data, count, error } = await supabase
    .from("webhook_settings")
    .select("id,org_id,name,url,bearer_token,json_body,event_type", {
      count: "exact",
    })
    .order("id")
    .range(from, to);

  const rows = (data ?? []) as Webhook[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const errorMsg = error?.message ?? null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.2)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Webhooks</h2>

        <CrudToolbar
          createTitle="Add Webhook"
          updateTitle="Update Webhook"
          deleteTitle="Delete Webhook"
          createFields={[
            { name: "name", label: "Name", required: true },
            { name: "url", label: "URL", type: "url", required: true },
              { name: "event_type", label: "Event Type", type: 'select', options: WEBHOOK_EVENT_OPTIONS, required: true, placeholder: 'Select event type' },
              { name: "org_id", label: "Org ID", placeholder: "uuid…", required: true },
            { name: "bearer_token", label: "Bearer Token (optional)" },
            { name: "json_body", label: "JSON Body (optional)", type: "textarea", placeholder: '{"key":"value"}' },
          ]}
          updateFields={[
            { name: "id", label: "ID", placeholder: "webhook id", required: true },
            { name: "name", label: "Name (optional)" },
            { name: "url", label: "URL (optional)", type: "url" },
              { name: "event_type", label: "Event Type (optional)", type: 'select', options: WEBHOOK_EVENT_OPTIONS, placeholder: 'Select event type' },
            { name: "org_id", label: "Org ID (optional)", placeholder: "uuid… (blank to clear)" },
            { name: "bearer_token", label: "Bearer Token (optional)" },
            { name: "json_body", label: "JSON Body (optional)", type: "textarea" },
          ]}
          deleteFields={[
            { name: "id", label: "ID", placeholder: "webhook id", required: true },
          ]}
          onCreateAction={createWebhookAction}
          onUpdateAction={updateWebhookAction}
          onDeleteAction={deleteWebhookAction}
        />
      </div>

      {errorMsg && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
          Could not load webhooks: {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <Th>ID</Th>
              <Th>Org ID</Th>
              <Th>Name</Th>
              <Th>URL</Th>
              <Th>Bearer Token</Th>
              <Th>JSON Body</Th>
              <Th>Event Type</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No data yet
                </td>
              </tr>
            )}
            {rows.map((w) => (
              <tr key={w.id} className="align-top hover:bg-gray-50/60">
                <Td>{w.id}</Td>
                <Td>{w.org_id ?? "—"}</Td>
                <Td>{w.name}</Td>
                <Td className="max-w-[260px] truncate" title={w.url}>
                  {w.url}
                </Td>
                <Td className="max-w-[160px] truncate" title={w.bearer_token ?? ""}>
                  {w.bearer_token ?? "—"}
                </Td>
                <Td className="max-w-[260px] truncate" title={w.json_body ?? ""}>
                  {w.json_body ?? "—"}
                </Td>
                <Td>{w.event_type}</Td>
              </tr>
            ))}
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
// Accept standard <th> attributes (className, title, etc.)
function Th({
  children,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-medium" {...rest}>
      {children}
    </th>
  );
}

// Accept standard <td> attributes (className, title, etc.)
function Td({
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3" {...rest}>
      {children}
    </td>
  );
}

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
        className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
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
            className={`h-8 rounded-md px-3 text-sm ${
              n === page
                ? "bg-[#5A54F9] text-white"
                : "border bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </Link>
        )
      )}
      <Link
        className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
        href={link(Math.min(totalPages, page + 1))}
        aria-label="Next page"
      >
        &gt;
      </Link>
    </div>
  );
}
