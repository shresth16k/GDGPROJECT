import type { Client } from '@libsql/client';

export async function generateUniqueRegistrationNumber(db: Client): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GDG-${year}-`;

  // Query highest existing sequence number for this year
  const result = await db.execute({
    sql: `SELECT COALESCE(MAX(CAST(SUBSTR(registration_number, 10) AS INTEGER)), 0) as max_seq 
          FROM registrations 
          WHERE registration_number LIKE ?`,
    args: [`${prefix}%`],
  });

  const nextSeq = Number(result.rows[0]?.max_seq || 0) + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
