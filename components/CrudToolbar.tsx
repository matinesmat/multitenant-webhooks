// components/CrudToolbar.tsx
'use client';

import { useState } from 'react';

type Field = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'url' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
};

type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
};

export default function CrudToolbar({
  createTitle = 'Create',
  updateTitle = 'Update',
  deleteTitle = 'Delete',
  createFields,
  updateFields,
  deleteFields,
  onCreateAction,
  onUpdateAction,
  onDeleteAction,
}: {
  createTitle?: string;
  updateTitle?: string;
  deleteTitle?: string;
  createFields: Field[];
  updateFields: Field[];
  deleteFields: Field[];
  onCreateAction: (fd: FormData) => Promise<ActionResponse>;
  onUpdateAction: (fd: FormData) => Promise<ActionResponse>;
  onDeleteAction: (fd: FormData) => Promise<ActionResponse>;
}) {
  const [open, setOpen] = useState<null | 'create' | 'update' | 'delete'>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: (fd: FormData) => Promise<ActionResponse>, formData: FormData) => {
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const response = await action(formData);
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Action completed successfully!' });
        // Close form after successful action
        setTimeout(() => {
          setOpen(null);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.error || 'Action failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Message Display */}
      {message && (
        <div className={`mb-3 rounded-md p-3 text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button className="rounded-full bg-teal-300/80 px-4 py-2 text-sm font-medium hover:bg-teal-300"
          onClick={() => setOpen(open === 'create' ? null : 'create')}>
          Add
        </button>
        <button className="rounded-full bg-red-300/80 px-4 py-2 text-sm font-medium hover:bg-red-300"
          onClick={() => setOpen(open === 'delete' ? null : 'delete')}>
          Delete
        </button>
        <button className="rounded-full bg-indigo-300/80 px-4 py-2 text-sm font-medium hover:bg-indigo-300"
          onClick={() => setOpen(open === 'update' ? null : 'update')}>
          Update
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-96 rounded-xl border bg-white p-4 shadow-xl">
            {open === 'create' && (
              <SimpleForm 
                title={createTitle} 
                fields={createFields}
                onSubmit={(fd) => handleAction(onCreateAction, fd)} 
                onClose={() => setOpen(null)} 
                submitLabel="Create"
                isSubmitting={isSubmitting}
              />
            )}
            {open === 'update' && (
              <SimpleForm 
                title={updateTitle} 
                fields={updateFields}
                onSubmit={(fd) => handleAction(onUpdateAction, fd)} 
                onClose={() => setOpen(null)} 
                submitLabel="Update"
                isSubmitting={isSubmitting}
              />
            )}
            {open === 'delete' && (
              <SimpleForm 
                title={deleteTitle} 
                fields={deleteFields}
                onSubmit={(fd) => handleAction(onDeleteAction, fd)} 
                onClose={() => setOpen(null)} 
                submitLabel="Delete"
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleForm({
  title, fields, onSubmit, onClose, submitLabel, isSubmitting,
}: {
  title: string;
  fields: Field[];
  onSubmit: (fd: FormData) => Promise<void>;
  onClose: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  return (
    <form action={onSubmit} className="space-y-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      {fields.map((f) => (
        <FieldInput key={f.name} field={f} />
      ))}
      <div className="mt-3 flex justify-end gap-2">
        <button 
          type="button" 
          onClick={onClose} 
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function FieldInput({ field }: { field: Field }) {
  const { name, label, placeholder, required, type = 'text', options } = field;
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-600">{label}</span>
      {type === 'textarea' ? (
        <textarea name={name} placeholder={placeholder} required={required}
          className="h-24 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
      ) : type === 'select' ? (
        <select name={name} required={required}
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">{placeholder || 'Select an option'}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === '' ? option.label : `${option.label} (${option.value})`}
            </option>
          ))}
        </select>
      ) : (
        <input name={name} placeholder={placeholder} required={required} type={type}
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
      )}
    </label>
  );
}
