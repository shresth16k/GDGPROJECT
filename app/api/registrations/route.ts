import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { registrationSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         '127.0.0.1';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  
  // Rate limiting: 3 registration attempts per 15 minutes per IP
  const rateLimitResult = await checkRateLimit(ip, 'registration', 3, 15 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const db = getDb();

  try {
    // Check event settings
    const settingsResult = await db.execute('SELECT * FROM event_settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event configuration not found' }, { status: 503 });
    }
    
    const settings = settingsResult.rows[0];
    if (settings.registration_status !== 'open') {
      return NextResponse.json({ error: 'Registration is currently closed.' }, { status: 403 });
    }

    // Check registration limit
    const limitNum = Number(settings.registration_limit || 0);
    if (limitNum > 0) {
      const countResult = await db.execute("SELECT COUNT(*) as count FROM registrations WHERE registration_status != 'cancelled'");
      if (Number(countResult.rows[0]?.count || 0) >= limitNum) {
        return NextResponse.json({ error: 'Registration is full. No more spots available.' }, { status: 403 });
      }
    }

    // Check duplicates
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
          { error: 'This email address is already registered.', code: 'DUPLICATE_EMAIL' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'This SAP ID is already registered.', code: 'DUPLICATE_SAP' },
        { status: 409 }
      );
    }

    // Generate unique registration number
    const year = new Date().getFullYear();
    const seqResult = await db.execute({
      sql: `SELECT COALESCE(MAX(CAST(SUBSTR(registration_number, -4) AS INTEGER)), 0) + 1 as next_num FROM registrations WHERE registration_number LIKE ?`,
      args: [`GDG-${year}-%`],
    });
    const nextNum = Number(seqResult.rows[0]?.next_num || 1);
    const regNumber = `GDG-${year}-${String(nextNum).padStart(4, '0')}`;

    const additionalJson = JSON.stringify(data.additional_fields || {});
    const now = new Date().toISOString();

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

    // Record analytics
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
      message: String(settings.registration_success_message || 'Registration successful!'),
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Registration error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return NextResponse.json(
        { error: 'You have already registered. Duplicate registration detected.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
