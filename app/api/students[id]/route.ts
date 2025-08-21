import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateStudentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  org_id: z.string().uuid().optional(),
});

function err(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// GET /api/students/:id
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const { data, error } = await supabase
    .from('students')
    .select('id,org_id,first_name,last_name,email')
    .eq('id', id)
    .single();

  if (error) return err(404, 'Student not found', error.message);
  return NextResponse.json(data);
}

// PATCH /api/students/:id
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) return err(400, 'Invalid payload', parsed.error.flatten());

  // If an optional field is missing, we don't touch it.
  // If it is provided as null (for org_id), we clear it.
  const update = parsed.data;

  const { data, error } = await supabase
    .from('students')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return err(500, 'Failed to update student', error.message);
  return NextResponse.json(data);
}

// DELETE /api/students/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return err(401, 'Unauthorized');

  const { error } = await supabase.from('students').delete().eq('id', id);

  if (error) return err(500, 'Failed to delete student', error.message);
  return new NextResponse(null, { status: 204 });
}
