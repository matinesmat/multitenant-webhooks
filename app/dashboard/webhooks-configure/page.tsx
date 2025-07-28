'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default function WebhookConfigPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const [form, setForm] = useState({
    event_type: 'create',
    table: 'students',
    url: '',
    authorization: '',
    body: `{\n  "enroll": "student_name",\n  "email": "student email"\n}`
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    await supabase.from('webhooks').insert({
      table: form.table,
      event_type: form.event_type,
      url: form.url,
      headers: JSON.stringify({ Authorization: `Bearer ${form.authorization}` }),
      body: form.body,
    })
    router.push('/dashboard/webhooks')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Webhook Configuration</h1>

      <div className="space-y-4">

        <div>
          <label className="block text-sm font-medium">Event Type</label>
          <select
            name="event_type"
            value={form.event_type}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Table</label>
          <select
            name="table"
            value={form.table}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="students">students</option>
            <option value="applications">applications</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Webhook URL</label>
          <input
            type="text"
            name="url"
            value={form.url}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="https://example.com/webhook"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Headers</label>
          <div className="flex items-center space-x-2">
            <span className="text-sm bg-gray-100 border px-2 py-1 rounded">Authorization</span>
            <input
              type="text"
              name="authorization"
              value={form.authorization}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Bearer token"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Body</label>
          <textarea
            name="body"
            rows={5}
            value={form.body}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded font-mono"
          />
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={() => router.push('/dashboard/webhooks')}
            className="px-4 py-2 rounded border"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  )
}
