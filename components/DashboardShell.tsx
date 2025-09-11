"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import OrgSwitcher from "@/components/OrgSwitcher";

function getOrgIdFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] ?? null;
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [user, setUser] = useState<{ user_metadata?: { full_name?: string }; email?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const orgId = getOrgIdFromPathname(pathname);
  const base = orgId ? `/${orgId}/dashboard` : "/select-organization";
  const NAV = [
    { href: `${base}`, label: "Dashboard", icon: "📊" },
    { href: `${base}/organizations`, label: "Organizations", icon: "🏢" },
    { href: `${base}/students`, label: "Students", icon: "👥" },
    { href: `${base}/agencies`, label: "Agencies", icon: "🏛️" },
    { href: `${base}/applications`, label: "Applications", icon: "📋" },
    { href: `${base}/webhook-settings`, label: "Webhook Settings", icon: "⚙️" },
    { href: `${base}/webhooks-log`, label: "Webhooks Log", icon: "📊" },
    { href: `${base}/settings`, label: "Settings", icon: "🔧" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load user and notifications
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    const loadNotifications = async () => {
      if (!orgId) return;
      
      // Load recent webhook failures as notifications
      const { data: failedWebhooks } = await supabase
        .from('webhooks_log')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(5);

      setNotificationCount(failedWebhooks?.length || 0);
    };

    loadUser();
    loadNotifications();
  }, [orgId, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar - 280px when expanded, 64px when collapsed */}
        <aside
          className={`sticky top-0 h-screen bg-card border-r border-border transition-all duration-300 ${
            expanded ? "w-[280px]" : "w-16"
          }`}
        >
          {/* Logo and Title */}
          <div className="flex h-16 items-center px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">W</span>
              </div>
              {expanded && (
                <div>
                  <h1 className="font-semibold text-foreground text-lg">Webhooks Manager</h1>
                  <p className="text-xs text-muted-foreground">Multitenant System</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <nav className="space-y-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      isActive(n.href)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  aria-current={isActive(n.href) ? "page" : undefined}
                >
                  <span className="text-lg flex-shrink-0">{n.icon}</span>
                  {expanded && <span className="truncate">{n.label}</span>}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <OrgSwitcher />
              </div>
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 1 1 15 0v5z" />
                    </svg>
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* User Avatar with Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                    </span>
                  </button>
                  
                  {/* User Menu Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href={`/${orgId}/dashboard/settings`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - Max 1200px wide */}
          <main className="flex-1 p-6">
            <div className="max-w-[1200px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
