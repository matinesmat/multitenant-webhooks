"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useOrganizationStore } from "@/stores/organizationStore";

type Organization = { id: string; name: string; slug: string };

export default function OrgSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const { selectedOrganization, setSelectedOrganization } = useOrganizationStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Load organizations on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setOrganizations([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("organizations")
        .select("id,name,slug")
        .order("name");
      if (mounted) {
        setOrganizations((data ?? []) as Organization[]);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Derive current org from slug in URL and keep store in sync
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const orgSlug = segments[0] ?? null;
    if (!orgSlug) {
      setSelectedOrganization(null);
      return;
    }
    const org = organizations.find((o) => o.slug === orgSlug);
    if (org) setSelectedOrganization(org);
    else setSelectedOrganization({ id: "", slug: orgSlug, name: orgSlug });
  }, [pathname, organizations, setSelectedOrganization]);

  const currentSlug = selectedOrganization?.slug ?? "";

  const options = useMemo(() => {
    return organizations.map((o) => ({ value: o.slug, label: o.name }));
  }, [organizations]);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextSlug = e.target.value;
    if (!nextSlug) return;
    if (nextSlug === "__create__") {
      router.push("/select-organization?create=1");
      return;
    }
    // Always navigate to students for selected org (by slug)
    const nextPath = `/${nextSlug}/dashboard/students`;
    const org =
      organizations.find((o) => o.slug === nextSlug) ?? {
        id: "",
        slug: nextSlug,
        name: nextSlug,
      };
    setSelectedOrganization(org);
    router.push(nextPath);
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <span className="text-gray-500">Org</span>
      <select
        className="rounded-md border px-2 py-1 text-sm"
        value={currentSlug || ""}
        onChange={onChange}
        disabled={loading || options.length === 0}
      >
        <option value="__create__">＋ Add organization</option>
        {!currentSlug && <option value="">Select…</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
