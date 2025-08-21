import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EVENT_TYPES = [
  'student.created',
  'student.updated',
  'student.deleted',
] as const;

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  event_type: z.enum(ALLOWED_EVENT_TYPES),
  org_id: z.string().uuid(),
  bearer_token: z.string(),
  json_body: z.string(), // store as text; validate JSON if you want
});

function err(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// GET /api/webhooks?page=1&perPage=8
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
    .from('webhook_settings')
    .select('id,org_id,name,url,bearer_token,json_body,event_type', { count: 'exact' })
    .order('id', { ascending: true })
    .range(from, to);

  if (error) return err(500, 'Failed to list webhooks', error.message);

  return NextResponse.json({
    page: p, perPage: pp, total: count ?? 0, rows: data ?? [],
  });
}

// POST /api/webhooks
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  const parsed = createWebhookSchema.safeParse(body);
  if (!parsed.success) return err(400, 'Invalid payload', parsed.error.flatten());

  const payload = parsed.data;
  const { data, error } = await supabase
    .from('webhook_settings')
    .insert({
      name: payload.name,
      url: payload.url,
      event_type: payload.event_type,
      org_id: payload.org_id,
      bearer_token: payload.bearer_token,
      json_body: payload.json_body,
    })
    .select()
    .single();

  if (error) return err(500, 'Failed to create webhook', error.message);
  return NextResponse.json(data, { status: 201 });
}
