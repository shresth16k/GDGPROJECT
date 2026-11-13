import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  let daysAgo: number;
  switch (range) {
    case 'today': daysAgo = 1; break;
    case '30d': daysAgo = 30; break;
    case 'all': daysAgo = 36500; break;
    default: daysAgo = 7;
  }

  const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const db = getDb();

  const [overview, topLinks, topButtons, timeSeries, regGrowth] = await Promise.all([
    db.execute({
      sql: `SELECT event_type, COUNT(*) as count FROM analytics_events WHERE created_at >= ? GROUP BY event_type`,
      args: [since],
    }),
    db.execute({
      sql: `SELECT element_name, element_label, element_id, COUNT(*) as count, MAX(created_at) as last_clicked
            FROM analytics_events WHERE event_type = 'link_click' AND created_at >= ?
            GROUP BY element_name ORDER BY count DESC LIMIT 20`,
      args: [since],
    }),
    db.execute({
      sql: `SELECT element_name, element_label, element_id, COUNT(*) as count, MAX(created_at) as last_clicked
            FROM analytics_events WHERE event_type = 'button_click' AND created_at >= ?
            GROUP BY element_name ORDER BY count DESC LIMIT 20`,
      args: [since],
    }),
    db.execute({
      sql: `SELECT DATE(created_at) as date, event_type, COUNT(*) as count
            FROM analytics_events WHERE created_at >= ?
            GROUP BY DATE(created_at), event_type ORDER BY date ASC`,
      args: [since],
    }),
    db.execute({
      sql: `SELECT DATE(registered_at) as date, COUNT(*) as count
            FROM registrations WHERE registered_at >= ?
            GROUP BY DATE(registered_at) ORDER BY date ASC`,
      args: [since],
    }),
  ]);

  const overviewMap: Record<string, number> = {};
  for (const row of overview.rows) {
    overviewMap[String(row.event_type)] = Number(row.count);
  }

  const pageVisits = overviewMap['page_view'] || 0;
  const successReg = overviewMap['registration_success'] || 0;
  const conversionRate = pageVisits > 0 ? Math.round(successReg / pageVisits * 1000) / 10 : 0;

  return NextResponse.json({
    overview: {
      ...overviewMap,
      conversion_rate: conversionRate,
    },
    topLinks: topLinks.rows,
    topButtons: topButtons.rows,
    timeSeries: timeSeries.rows,
    registrationGrowth: regGrowth.rows,
  });
}
