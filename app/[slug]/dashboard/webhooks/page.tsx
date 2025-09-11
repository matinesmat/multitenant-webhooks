import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import CrudToolbar from "@/components/CrudToolbar";
import * as React from "react";
import { createWebhookAction, updateWebhookAction, deleteWebhookAction } from "./actions";

// If you have generated Supabase types, you can do:
// import type { Database } from "@/types/supabase";

const WEBHOOK_EVENT_OPTIONS = [
  { value: "student.created", label: "Student Created" },
  { value: "student.updated", label: "Student Updated" },
  { value: "student.deleted", label: "Student Deleted" },
];

type Webhook = {
  id: string;
  org_slug: string;
  name: string;
  url: string;
  bearer_token: string | null;
  json_body: string | null;
  event_type: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const LIST_PATH = (orgId: string) => `/${orgId}/dashboard/webhooks`;

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

export default async function WebhooksPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const sp = searchParams;
  const page = getPage(sp);
  const perPage = 8;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // If you have generated types, use: createServerComponentClient<Database>({ cookies })
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // List rows for this tenant by org_slug
  const { data, count, error } = await supabase
    .from("webhook_settings")
    .select("id,org_slug,name,url,bearer_token,json_body,event_type", { count: "exact" })
    .eq("org_slug", params.slug)
    .order("id")
    .range(from, to);

  const rows = (data ?? []) as Webhook[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const errorMsg = error?.message ?? null;

  // Server action wrappers bound to current org (create/update/delete)
  async function createForOrg(fd: FormData) {
    "use server";
    return createWebhookAction(fd, params.slug);
  }
  async function updateForOrg(fd: FormData) {
    "use server";
    return updateWebhookAction(fd, params.slug);
  }
  async function deleteForOrg(fd: FormData) {
    "use server";
    return deleteWebhookAction(fd, params.slug);
  }

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
            {
              name: "event_type",
              label: "Event Type",
              type: "select",
              options: WEBHOOK_EVENT_OPTIONS,
              required: true,
              placeholder: "Select event type",
            },
            { name: "bearer_token", label: "Bearer Token (optional)" },
            {
              name: "json_body",
              label: "JSON Body (optional)",
              type: "textarea",
              placeholder: '{"key":"value"}',
            },
          ]}
          updateFields={[
            { name: "id", label: "ID", placeholder: "webhook id", required: true },
            { name: "name", label: "Name (optional)" },
            { name: "url", label: "URL (optional)", type: "url" },
            {
              name: "event_type",
              label: "Event Type (optional)",
              type: "select",
              options: WEBHOOK_EVENT_OPTIONS,
              placeholder: "Select event type",
            },
            { name: "bearer_token", label: "Bearer Token (optional)" },
            { name: "json_body", label: "JSON Body (optional)", type: "textarea" },
          ]}
          deleteFields={[{ name: "id", label: "ID", placeholder: "webhook id", required: true }]}
          onCreateAction={createForOrg}
          onUpdateAction={updateForOrg}
          onDeleteAction={deleteForOrg} // <- scope delete to this org
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
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No data yet
                </td>
              </tr>
            )}
            {rows.map((w) => (
              <tr key={w.id} className="align-top hover:bg-gray-50/60">
                <Td>{w.id}</Td>
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
        <div>Showing {rows.length ? `${from + 1}–${from + rows.length}` : 0} of {total.toLocaleString()} entries</div>
        <Pagination baseHref={LIST_PATH(params.slug)} page={page} totalPages={totalPages} />
      </div>
    </section>
  );
}

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
      <a
        className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
        href={link(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        &lt;
      </a>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <a
            key={n}
            href={link(n)}
            className={`h-8 rounded-md px-3 text-sm ${
              n === page ? "bg-[#5A54F9] text-white" : "border bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </a>
        )
      )}
      <a
        className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
        href={link(Math.min(totalPages, page + 1))}
        aria-label="Next page"
      >
        &gt;
      </a>
    </div>
  );
}
