import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    
    const [totalReg, linkClicks, pageVisits, successReg, recentReg] = await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM registrations WHERE registration_status = 'confirmed'").catch(() => ({ rows: [{ count: 0 }] })),
      db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'link_click'").catch(() => ({ rows: [{ count: 0 }] })),
      db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view'").catch(() => ({ rows: [{ count: 0 }] })),
      db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'registration_success'").catch(() => ({ rows: [{ count: 0 }] })),
      db.execute("SELECT id, registration_number, full_name, email, sap_id, registered_at FROM registrations ORDER BY registered_at DESC LIMIT 10").catch(() => ({ rows: [] })),
    ]);

    const totalRegistrations = Number(totalReg.rows[0]?.count || 0);
    const totalLinkClicks = Number(linkClicks.rows[0]?.count || 0);
    const totalPageVisits = Number(pageVisits.rows[0]?.count || 0);
    const successfulRegistrations = Number(successReg.rows[0]?.count || 0);
    const conversionRate = totalPageVisits > 0 ? (successfulRegistrations / totalPageVisits * 100) : 0;

    return NextResponse.json({
      stats: {
        totalRegistrations,
        totalLinkClicks,
        totalPageVisits,
        successfulRegistrations,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      recentRegistrations: recentReg.rows,
    });
  } catch (err: any) {
    console.error('Admin dashboard fetch error:', err);
    return NextResponse.json({
      stats: {
        totalRegistrations: 0,
        totalLinkClicks: 0,
        totalPageVisits: 0,
        successfulRegistrations: 0,
        conversionRate: 0,
      },
      recentRegistrations: [],
    });
  }
}
