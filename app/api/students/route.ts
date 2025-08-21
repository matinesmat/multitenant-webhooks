import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createStudentSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  org_id: z.string().uuid(),
});

function err(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// GET /api/students?page=1&perPage=8
export async function GET(req: Request) {
  const supabase = await supabaseServer();

  // Auth: cookie session must exist
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = Number(url.searchParams.get('perPage') ?? '8');
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : 8;

  const from = (safePage - 1) * safePerPage;
  const to = from + safePerPage - 1;

  const { data, count, error } = await supabase
    .from('students')
    .select('id,org_id,first_name,last_name,email', { count: 'exact' })
    .order('id', { ascending: true })
    .range(from, to);

  if (error) return err(500, 'Failed to list students', error.message);

  return NextResponse.json({
    page: safePage,
    perPage: safePerPage,
    total: count ?? 0,
    rows: data ?? [],
  });
}

// POST /api/students
export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) return err(400, 'Invalid payload', parsed.error.flatten());

  const payload = parsed.data;

  const { data, error } = await supabase
    .from('students')
    .insert({
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      org_id: payload.org_id,
    })
    .select()
    .single();

  if (error) return err(500, 'Failed to create student', error.message);

  return NextResponse.json(data, { status: 201 });
}
