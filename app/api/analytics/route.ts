import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const analyticsSchema = z.object({
  event_type: z.enum(['page_view','link_click','button_click','registration_form_start','registration_attempt','registration_success','registration_error']),
  element_name: z.string().max(100).optional(),
  element_id: z.string().max(100).optional(),
  element_label: z.string().max(200).optional(),
  target_url: z.string().max(500).optional(),
  page_path: z.string().max(200).optional(),
  anonymous_session_id: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const parsed = analyticsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid analytics data' }, { status: 400 });
  }

  const data = parsed.data;
  
  try {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO analytics_events (event_type, element_name, element_id, element_label, target_url, page_path, anonymous_session_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.event_type,
        data.element_name || null,
        data.element_id || null,
        data.element_label || null,
        data.target_url || null,
        data.page_path || null,
        data.anonymous_session_id || null,
        new Date().toISOString(),
      ],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics write error:', error);
    return NextResponse.json({ ok: false });
  }
}
