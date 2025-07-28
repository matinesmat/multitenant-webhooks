'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className={clsx('hover:underline', {
              'font-bold': pathname === '/dashboard',
            })}
          >
            Home
          </Link>

          <Link
            href="/dashboard/students"
            className={clsx('hover:underline', {
              'font-bold': pathname.startsWith('/dashboard/students'),
            })}
          >
            Students
          </Link>

          <Link
            href="/dashboard/webhooks"
            className={clsx('hover:underline', {
              'font-bold': pathname.startsWith('/dashboard/webhooks') && !pathname.includes('configure'),
            })}
          >
            Webhook Settings
          </Link>

          <Link
            href="/dashboard/webhooks-configure"
            className={clsx('hover:underline', {
              'font-bold': pathname === '/dashboard/webhooks-configure',
            })}
          >
            Webhooks Configure
          </Link>
        </nav>
      </aside>

      <main className="flex-1 bg-gray-100 p-10 overflow-y-auto">{children}</main>
    </div>
  )
}
