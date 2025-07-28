'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

type Student = {
  id: string
  name: string
}

export default function StudentsPage() {
  const supabase = createBrowserSupabaseClient()
  const [students, setStudents] = useState<Student[]>([])
  const [newStudent, setNewStudent] = useState('')

  const fetchStudents = async () => {
    const { data, error } = await supabase.from('students').select('*').order('name')
    if (!error) setStudents(data as Student[])
  }

  const addStudent = async () => {
    if (!newStudent.trim()) return
    const { error } = await supabase.from('students').insert({ name: newStudent })
    if (!error) {
      setNewStudent('')
      fetchStudents()
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Students</h1>

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Student name"
          value={newStudent}
          onChange={(e) => setNewStudent(e.target.value)}
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          onClick={addStudent}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Add Student
        </button>
      </div>

      <div className="border rounded">
        {students.map((student) => (
          <div key={student.id} className="border-b px-4 py-2">
            {student.name}
          </div>
        ))}
        {students.length === 0 && (
          <div className="px-4 py-2 text-gray-500 text-sm">No students yet</div>
        )}
      </div>
    </div>
  )
}
