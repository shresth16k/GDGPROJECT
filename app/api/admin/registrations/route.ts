import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'registered_at';
  const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const db = getDb();
  
  let whereClause = '1=1';
  const args: (string | number)[] = [];

  if (search) {
    whereClause += ' AND (lower(full_name) LIKE ? OR lower(email) LIKE ? OR lower(sap_id) LIKE ? OR registration_number LIKE ?)';
    const s = `%${search.toLowerCase()}%`;
    args.push(s, s, s, `%${search}%`);
  }
  if (status) {
    whereClause += ' AND registration_status = ?';
    args.push(status);
  }

  const allowedSorts = ['registered_at', 'full_name', 'registration_number'];
  const sortField = allowedSorts.includes(sort) ? sort : 'registered_at';

  const [countResult, dataResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as count FROM registrations WHERE ${whereClause}`, args }),
    db.execute({
      sql: `SELECT id, registration_number, full_name, email, sap_id, department, year, registration_status, registered_at FROM registrations WHERE ${whereClause} ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    }),
  ]);

  return NextResponse.json({
    registrations: dataResult.rows,
    total: Number(countResult.rows[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0]?.count || 0) / limit),
  });
}
