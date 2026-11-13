import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { logAdminActivity } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM registrations WHERE id = ?', args: [id] });
  
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ registration: result.rows[0] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { registration_status } = body;

  if (!['confirmed', 'cancelled', 'pending'].includes(registration_status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getDb();
  await db.execute({
    sql: 'UPDATE registrations SET registration_status = ?, updated_at = ? WHERE id = ?',
    args: [registration_status, new Date().toISOString(), id],
  });

  await logAdminActivity('registration_update', `Registration ${id} status changed to ${registration_status}`);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  
  const existing = await db.execute({ sql: 'SELECT registration_number FROM registrations WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.execute({ sql: 'DELETE FROM registrations WHERE id = ?', args: [id] });
  await logAdminActivity('registration_delete', `Deleted registration ${existing.rows[0].registration_number}`);
  
  return NextResponse.json({ success: true });
}
