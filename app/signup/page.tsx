'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import PasswordInput from '@/components/PasswordInput'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return setError("Passwords don't match")

    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
      },
    })

    if (signupError) setError(signupError.message)
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        <PasswordInput name="password" placeholder="Password" value={form.password} onChange={handleChange} />
        <PasswordInput name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Sign Up</button>
      </form>
    </div>
  )
}