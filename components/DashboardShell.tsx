"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import OrgSwitcher from "@/components/OrgSwitcher";

function getOrgIdFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] ?? null;
}

export default function DashboardShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const orgId = getOrgIdFromPathname(pathname);
  const base = orgId ? `/${orgId}/dashboard` : "/select-organization";
  const NAV = [
    { href: `${base}`, label: "Dashboard", icon: "🏠" },
    { href: `${base}/students`, label: "Students", icon: "👥" },
    { href: `${base}/webhooks`, label: "Webhooks", icon: "🔗" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login"); // change to your auth route if different
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`sticky top-0 h-screen bg-white border-r shadow-sm transition-all ${
            expanded ? "w-64" : "w-16"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gray-900 text-white">
                ⎈
              </div>
              {expanded && <span className="font-semibold">Dashboard</span>}
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
              aria-label="Toggle sidebar"
            >
              {expanded ? "‹" : "›"}
            </button>
          </div>

          <nav className="mt-2 px-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm capitalize
                  ${
                    isActive(n.href)
                      ? "bg-[#5A54F9]/10 text-[#5A54F9] font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                aria-current={isActive(n.href) ? "page" : undefined}
              >
                <span className="text-lg">{n.icon}</span>
                {expanded && <span>{n.label}</span>}
                {expanded && isActive(n.href) && (
                  <span className="ml-auto">›</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Sidebar footer (org switcher + avatar + name + logout) */}
          <div className="absolute bottom-3 left-0 right-0 px-3">
            {expanded && (
              <div className="mb-2 flex items-center justify-between">
                <OrgSwitcher />
              </div>
            )}
            <div
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                expanded ? "" : "justify-center"
              }`}
            >
              <Image
                src="https://i.pravatar.cc/64"
                alt="avatar"
                width={32}
                height={32}
                className="rounded-full"
                priority
              />
              {expanded && (
                <div className="min-w-0 text-xs">
                  <div className="truncate font-medium">{userName}</div>
                  <div className="truncate text-gray-500">
                    organization manager
                  </div>
                </div>
              )}

              {/* Logout button */}
              {expanded ? (
                <button
                  onClick={handleLogout}
                  className="ml-auto rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  aria-label="Logout"
                  title="Logout"
                >
                  ⎋
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main area (no “Hello, user” header) */}
        <main className="mx-auto flex-1 max-w-[1200px] p-6">{children}</main>
      </div>
    </div>
  );
}
