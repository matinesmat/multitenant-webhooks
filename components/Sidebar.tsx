'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Students', href: '/dashboard/students' },
  { name: 'Applications', href: '/dashboard/applications' },
  { name: 'Webhooks', href: '/dashboard/webhooks' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 space-y-4">
      <h2 className="text-xl font-bold">MyApp</h2>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded hover:bg-gray-700 ${
              pathname === item.href ? 'bg-gray-800' : ''
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
