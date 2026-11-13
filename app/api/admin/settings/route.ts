import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { settingsSchema } from '@/lib/validation';
import { logAdminActivity } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = getDb();
  const result = await db.execute('SELECT * FROM event_settings WHERE id = 1');
  return NextResponse.json({ settings: result.rows[0] || null });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO event_settings (id, event_name, event_description, event_date, event_time, event_venue, campus_name, university_name, gdg_logo_url, upes_logo_url, registration_status, registration_limit, primary_contact_email, custom_fields_json, show_registration_count, registration_success_message, created_at, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            event_name=excluded.event_name, event_description=excluded.event_description,
            event_date=excluded.event_date, event_time=excluded.event_time,
            event_venue=excluded.event_venue, campus_name=excluded.campus_name,
            university_name=excluded.university_name, gdg_logo_url=excluded.gdg_logo_url,
            upes_logo_url=excluded.upes_logo_url, registration_status=excluded.registration_status,
            registration_limit=excluded.registration_limit, primary_contact_email=excluded.primary_contact_email,
            custom_fields_json=excluded.custom_fields_json, show_registration_count=excluded.show_registration_count,
            registration_success_message=excluded.registration_success_message, updated_at=excluded.updated_at`,
    args: [
      d.event_name, d.event_description || null, d.event_date || null, d.event_time || null,
      d.event_venue || null, d.campus_name || null, d.university_name || null,
      d.gdg_logo_url || null, d.upes_logo_url || null, d.registration_status,
      d.registration_limit ?? 0, d.primary_contact_email || null,
      d.custom_fields_json || '[]', d.show_registration_count ? 1 : 0,
      d.registration_success_message || null, now, now,
    ],
  });

  await logAdminActivity('settings_update', 'Event settings updated');
  return NextResponse.json({ success: true });
}
