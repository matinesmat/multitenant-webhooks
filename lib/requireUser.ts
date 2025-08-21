// lib/auth/requireUser.ts
import { supabaseAction } from '@/lib/server';
import { redirect } from 'next/navigation';

export async function requireUser() {
  const supabase = supabaseAction();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect('/login');
  return session.user;
}
