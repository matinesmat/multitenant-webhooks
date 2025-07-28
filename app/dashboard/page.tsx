'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setUserEmail(data.user.email || '')
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-[#f0f4f8] via-[#e3ecf5] to-[#f7f9fc] flex flex-col items-center text-gray-800">
      {/* Welcome Header */}
      <header className="text-center mt-20 px-4">
        <h1 className="text-4xl sm:text-5xl font-semibold font-sans tracking-tight">Welcome</h1>
        <p className="mt-2 text-lg text-gray-600">{userEmail}</p>
      </header>

      {/* Placeholder for future dashboard content */}
      <section className="mt-12 w-full max-w-4xl px-4">
        <div className="rounded-xl bg-white shadow-md p-8">
          <h2 className="text-2xl font-medium mb-4">Your world, organized.</h2>
          <p className="text-gray-600">Where ideas turn into action-start your journey today.</p>
        </div>
      </section>

      {/* Logout Button - Bottom Left */}
      <button
        onClick={handleLogout}
        className="absolute bottom-6 left-6 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded shadow-md"
      >
        Logout
      </button>
    </div>
  )
}
