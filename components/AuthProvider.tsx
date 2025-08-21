'use client';

import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export default function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  /** Optional: pass the server session to avoid a flash of unauthenticated content */
  initialSession?: Session | null;
}) {
  const [supabaseClient] = useState(() =>
    createClientComponentClient<Database>()
  );

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}
