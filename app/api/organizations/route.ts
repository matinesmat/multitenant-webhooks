import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1), // Require slug
});

function err(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// GET /api/organizations?page=1&perPage=8
export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = Number(url.searchParams.get('perPage') ?? '8');
  const p = Number.isFinite(page) && page > 0 ? page : 1;
  const pp = Number.isFinite(perPage) && perPage > 0 ? perPage : 8;

  const from = (p - 1) * pp;
  const to = from + pp - 1;

  const { data, count, error } = await supabase
    .from('organizations')
    .select('slug,name,owner_id', { count: 'exact' }) // Use slug
    .order('slug', { ascending: true }) // Order by slug
    .range(from, to);

  if (error) return err(500, 'Failed to list organizations', error.message);

  return NextResponse.json({
    page: p, perPage: pp, total: count ?? 0, rows: data ?? [],
  });
}

// POST /api/organizations
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) return err(400, 'Invalid payload', parsed.error.flatten());

  const payload = parsed.data;
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name: payload.name, slug: payload.slug, owner_id: session.user.id }) // Include slug
    .select()
    .single();

  if (error) return err(500, 'Failed to create organization', error.message);
  return NextResponse.json(data, { status: 201 });
}
