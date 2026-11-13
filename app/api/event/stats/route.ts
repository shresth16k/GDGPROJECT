import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDb();
    const [settingsResult, countResult] = await Promise.all([
      db.execute('SELECT show_registration_count FROM event_settings WHERE id = 1'),
      db.execute("SELECT COUNT(*) as count FROM registrations WHERE registration_status = 'confirmed'"),
    ]);
    
    const settings = settingsResult.rows[0];
    const showCount = settings?.show_registration_count;
    
    return NextResponse.json({
      show_count: Boolean(showCount),
      count: showCount ? Number(countResult.rows[0]?.count || 0) : null,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ show_count: false, count: null });
  }
}
