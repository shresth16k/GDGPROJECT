import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { registrationSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIdentifier(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             '127.0.0.1';
  const ua = req.headers.get('user-agent') || '';
  return `${ip}_${ua.slice(0, 30)}`;
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  
  // Rate limiting: 20 registration attempts per 10 minutes per client
  // accommodating campus NAT environments while preventing automated spam
  const rateLimitResult = await checkRateLimit(clientId, 'registration', 20, 10 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please wait a few minutes before trying again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message);
    return NextResponse.json(
      { error: issues[0] || 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const db = getDb();

  try {
    // 1. Check event settings
    const settingsResult = await db.execute('SELECT * FROM event_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event configuration not found.' }, { status: 503 });
    }
    
    const settings = settingsResult.rows[0];
    if (settings.registration_status !== 'open') {
      return NextResponse.json({ error: 'Registration for this event is currently closed.' }, { status: 403 });
    }

    // 2. Check registration capacity limit
    const limitNum = Number(settings.registration_limit || 0);
    if (limitNum > 0) {
      const countResult = await db.execute("SELECT COUNT(*) as count FROM registrations WHERE registration_status != 'cancelled'");
      const currentCount = Number(countResult.rows[0]?.count || 0);
      if (currentCount >= limitNum) {
        return NextResponse.json({ error: 'Registration capacity has been reached. No more slots are available.' }, { status: 403 });
      }
    }

    // 3. Strict normalized uniqueness check for Email and SAP ID
    const emailNorm = data.email.toLowerCase().trim();
    const sapNorm = data.sap_id.toLowerCase().trim();
    
    const dupCheck = await db.execute({
      sql: 'SELECT id, email, sap_id FROM registrations WHERE lower(email) = ? OR lower(sap_id) = ?',
      args: [emailNorm, sapNorm],
    });
    
    if (dupCheck.rows.length > 0) {
      const dup = dupCheck.rows[0];
      if (String(dup.email).toLowerCase() === emailNorm) {
        return NextResponse.json(
          { error: 'This university email address is already registered for this event.', code: 'DUPLICATE_EMAIL' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'This SAP ID is already registered for this event.', code: 'DUPLICATE_SAP' },
        { status: 409 }
      );
    }

    // 4. Generate unique registration sequence
    const year = new Date().getFullYear();
    const prefix = `GDG-${year}-`;
    const seqResult = await db.execute({
      sql: `SELECT COALESCE(MAX(CAST(SUBSTR(registration_number, 10) AS INTEGER)), 0) as max_seq FROM registrations WHERE registration_number LIKE ?`,
      args: [`${prefix}%`],
    });
    const nextSeq = Number(seqResult.rows[0]?.max_seq || 0) + 1;
    const regNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    const additionalJson = JSON.stringify(data.additional_fields || {});
    const now = new Date().toISOString();

    // 5. Insert registration record into database
    await db.execute({
      sql: `INSERT INTO registrations 
        (registration_number, full_name, email, sap_id, department, specialization, year, semester, phone_number, additional_fields_json, registration_status, registered_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
      args: [
        regNumber,
        data.full_name.trim(),
        emailNorm,
        data.sap_id.trim(),
        data.department || null,
        data.specialization || null,
        data.year || null,
        data.semester || null,
        data.phone_number || null,
        additionalJson,
        now,
        now,
      ],
    });

    // 6. Record analytics event
    try {
      await db.execute({
        sql: `INSERT INTO analytics_events (event_type, registration_reference, page_path, created_at) VALUES ('registration_success', ?, '/', ?)`,
        args: [regNumber, now],
      });
    } catch {}

    return NextResponse.json({
      success: true,
      registration_number: regNumber,
      full_name: data.full_name.trim(),
      message: String(settings.registration_success_message || 'You have successfully registered for the event!'),
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Registration processing error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return NextResponse.json(
        { error: 'Duplicate registration detected. Either your Email or SAP ID has already been registered.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to process registration. Please retry.' }, { status: 500 });
  }
}
