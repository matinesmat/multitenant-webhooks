"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import OrgSwitcher from "@/components/OrgSwitcher";

type Notification = {
  id: string;
  type: 'webhook' | 'student';
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
};

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
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<{ user_metadata?: { full_name?: string }; email?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const orgId = getOrgIdFromPathname(pathname);
  const base = orgId ? `/${orgId}/dashboard` : "/select-organization";
  const NAV = [
    { href: `${base}`, label: "Dashboard", icon: "📊" },
    { href: `${base}/students`, label: "Students", icon: "👥" },
    { href: `${base}/agencies`, label: "Agencies", icon: "🏛️" },
    { href: `${base}/applications`, label: "Applications", icon: "📋" },
    { href: `${base}/webhook-settings`, label: "Webhook Settings", icon: "⚙️" },
    // Webhook logging removed
    { href: `${base}/settings`, label: "Settings", icon: "🔧" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
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
      
      try {
        // Load recent webhook activities as notifications
        const { data: webhookActivities } = await supabase
          .from('webhook_activity_logs')
          .select('*')
          .eq('org_slug', orgId)
          .order('created_at', { ascending: false })
          .limit(10);

        // Load recent student activities
        const { data: studentActivities } = await supabase
          .from('students')
          .select('first_name, last_name, created_at, updated_at')
          .eq('org_slug', orgId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Combine and format notifications
        const allNotifications: Notification[] = [
          ...(webhookActivities || []).map(activity => ({
            id: `webhook-${activity.id}`,
            type: 'webhook' as const,
            title: 'Webhook Activity',
            message: `Webhook ${activity.status} for ${activity.event_type}`,
            timestamp: activity.created_at,
            unread: !activity.read_at
          })),
          ...(studentActivities || []).map(student => ({
            id: `student-${student.created_at}`,
            type: 'student' as const,
            title: 'New Student',
            message: `${student.first_name} ${student.last_name} was added`,
            timestamp: student.created_at,
            unread: true
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setNotifications(allNotifications);
        setNotificationCount(allNotifications.filter(n => n.unread).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotificationCount(0);
        setNotifications([]);
      }
    };

    loadUser();
    loadNotifications();
  }, [orgId, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const markNotificationAsRead = async (notificationId: string) => {
    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
    );
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setNotificationCount(0);
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
                <div className="relative" ref={notificationMenuRef}>
                  <button 
                    onClick={() => {
                      setNotificationMenuOpen(!notificationMenuOpen);
                      setUserMenuOpen(false);
                    }}
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
                  
                  {/* Notification Dropdown */}
                  {notificationMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {notificationCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 1 1 15 0v5z" />
                          </svg>
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                notification.unread ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                              }`}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
