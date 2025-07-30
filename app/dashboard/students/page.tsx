'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

const supabase = createBrowserSupabaseClient()

export default function StudentsPage() {
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [students, setStudents] = useState<{ id: string, name: string, email: string }[]>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  // 1. Fetch user's org ID
  useEffect(() => {
    const fetchOrgId = async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser()
      if (authError || !userData?.user) {
        setError('User not found')
        return
      }

      const { data: userDetails, error: orgError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single()

      if (orgError || !userDetails) {
        setError('Failed to fetch org ID')
        return
      }

      setOrganizationId(userDetails.organization_id)
    }

    fetchOrgId()
  }, [])

  // 2. Fetch students
  useEffect(() => {
    if (!organizationId) return

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Failed to fetch students:', error)
        setError('Failed to load students')
      } else {
        setStudents(data || [])
      }
    }

    fetchStudents()
  }, [organizationId])

  // 3. Add student
  const handleAddStudent = async () => {
    if (!studentName || !studentEmail || !organizationId) {
      alert('Please fill in all fields.')
      return
    }

    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          name: studentName,
          email: studentEmail,
          organization_id: organizationId,
        },
      ])
      .select()

    if (error) {
      console.error('Error adding student:', error)
      setError('Failed to add student.')
    } else if (data) {
      setStudents((prev) => [...prev, data[0]])
      setStudentName('')
      setStudentEmail('')
      setError('')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Students</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="flex gap-2 mb-4 flex-col sm:flex-row">
        <input
          type="text"
          placeholder="Student name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <input
          type="email"
          placeholder="Student email"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <button
          onClick={handleAddStudent}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Add Student
        </button>
      </div>

      <div className="bg-white rounded shadow p-4">
        {students.length === 0 ? (
          <p className="text-gray-500">No students yet</p>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
