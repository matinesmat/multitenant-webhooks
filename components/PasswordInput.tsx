'use client'

import { useState } from 'react'

export default function PasswordInput({
  name,
  placeholder,
  value,
  onChange,
}: {
  name: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-2 text-sm text-blue-600">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
