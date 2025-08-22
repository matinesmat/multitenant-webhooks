import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  owner_id: z.string().uuid().nullable().optional(),
});

function err(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// GET /api/organizations/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const { data, error } = await supabase
    .from('organizations')
    .select('id,name,owner_id')
    .eq('id', id)
    .single();

  if (error) return err(404, 'Organization not found', error.message);
  return NextResponse.json(data);
}

// PATCH /api/organizations/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) return err(400, 'Invalid payload', parsed.error.flatten());

  const update = parsed.data; // owner_id nullable allowed
  const { data, error } = await supabase
    .from('organizations')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return err(500, 'Failed to update organization', error.message);
  return NextResponse.json(data);
}

// DELETE /api/organizations/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const { error } = await supabase.from('organizations').delete().eq('id', id);
  if (error) return err(500, 'Failed to delete organization', error.message);
  return new NextResponse(null, { status: 204 });
}
