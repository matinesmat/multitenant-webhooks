'use client';

import { useState } from 'react';

export default function PasswordInput({
  name,
  placeholder,
  defaultValue,
  value,
  onChange,
  required = true,
  autoComplete = 'current-password',
  className,
  id,
  label,
}: {
  name: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  id?: string;
  /** Optional visible label. If omitted, input remains unlabeled (use surrounding label). */
  label?: string;
}) {
  const [show, setShow] = useState(false);
  const inputId = id ?? `${name}-input`;

  return (
    <div className={`relative ${className ?? ''}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm text-gray-600">
          {label}
        </label>
      )}

      <input
        id={inputId}
        type={show ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-600 hover:underline"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
