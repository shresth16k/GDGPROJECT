import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM event_settings WHERE id = 1');
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event settings not found' }, { status: 404 });
    }
    
    const settings = result.rows[0];
    return NextResponse.json({ settings }, { 
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    });
  } catch (error) {
    console.error('Event settings error:', error);
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }
}
