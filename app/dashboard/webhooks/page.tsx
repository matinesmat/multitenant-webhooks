'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

type Webhook = {
  id: number
  table: string
  event_type: string
  url: string
}

export default function WebhookSettingsPage() {
  const supabase = createBrowserSupabaseClient()

  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  useEffect(() => {
    supabase.from('webhooks').select('*').then(({ data }) => {
      if (data) setWebhooks(data)
    })
  }, [])

  const createWebhook = async () => {
    for (const event of selectedEvents) {
      await supabase.from('webhooks').insert({
        table: 'students',
        event_type: event,
        url: 'https://example.com/webhook',
      })
    }

    const { data } = await supabase.from('webhooks').select('*')
    if (data) setWebhooks(data)
    setSelectedEvents([])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Webhook Settings</h1>

      <div>
        <h2 className="font-semibold mb-2">Students</h2>
        <div className="flex gap-4 mb-4">
          {['create', 'update', 'delete'].map(event => (
            <label key={event} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedEvents.includes(event)}
                onChange={() => toggleEvent(event)}
              />
              <span className="capitalize">{event}</span>
            </label>
          ))}
        </div>

        <button
          onClick={createWebhook}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Create Webhook
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Applications</h2>
        <table className="w-full border border-gray-300 rounded shadow text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Table</th>
              <th className="p-2">Event Type</th>
              <th className="p-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((hook) => (
              <tr key={hook.id} className="border-t">
                <td className="p-2">{hook.table}</td>
                <td className="p-2 capitalize">{hook.event_type}</td>
                <td className="p-2">{hook.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
