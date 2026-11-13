import { getDb } from './db';
import crypto from 'crypto';

export async function checkRateLimit(
  identifier: string,
  requestType: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const db = getDb();
  const hash = crypto.createHash('sha256').update(identifier).digest('hex');
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  try {
    // Delete expired rate limits for this request type
    await db.execute({
      sql: 'DELETE FROM rate_limits WHERE window_start < ? AND request_type = ?',
      args: [windowStart, requestType],
    });

    const result = await db.execute({
      sql: 'SELECT request_count, window_start FROM rate_limits WHERE identifier_hash = ? AND request_type = ?',
      args: [hash, requestType],
    });

    if (result.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO rate_limits (identifier_hash, request_type, request_count, window_start, updated_at) VALUES (?, ?, 1, ?, ?)',
        args: [hash, requestType, new Date().toISOString(), new Date().toISOString()],
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const row = result.rows[0];
    const count = Number(row.request_count || 0);

    if (count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    await db.execute({
      sql: 'UPDATE rate_limits SET request_count = request_count + 1, updated_at = ? WHERE identifier_hash = ? AND request_type = ?',
      args: [new Date().toISOString(), hash, requestType],
    });

    return { allowed: true, remaining: maxRequests - count - 1 };
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail open in case of rate limit DB error
    return { allowed: true, remaining: maxRequests };
  }
}

