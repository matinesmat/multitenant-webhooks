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

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  event_type: z.enum(ALLOWED_EVENT_TYPES).optional(),
  org_id: z.string().uuid().optional(),
  bearer_token: z.string().optional(),
  json_body: z.string().optional(),
});

function err(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// GET /api/webhooks/:id
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const { data, error } = await supabase
    .from('webhook_settings')
    .select('id,org_id,name,url,bearer_token,json_body,event_type')
    .eq('id', id)
    .single();

  if (error) return err(404, 'Webhook not found', error.message);
  return NextResponse.json(data);
}

// PATCH /api/webhooks/:id
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  const parsed = updateWebhookSchema.safeParse(body);
  if (!parsed.success) return err(400, 'Invalid payload', parsed.error.flatten());

  const update = parsed.data;

  const { data, error } = await supabase
    .from('webhook_settings')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return err(500, 'Failed to update webhook', error.message);
  return NextResponse.json(data);
}

// DELETE /api/webhooks/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const { error } = await supabase.from('webhook_settings').delete().eq('id', id);
  if (error) return err(500, 'Failed to delete webhook', error.message);
  return new NextResponse(null, { status: 204 });
}
