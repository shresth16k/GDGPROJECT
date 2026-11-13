import bcrypt from 'bcryptjs';
import { getDb } from './db';

const MASTER_PASSWORD = 'Admin@GDG2026!';
const DEFAULT_HASH = '$2b$12$wadhBS0UmN7egKB.O8WsVupUv1FbJoGTupm73Gw15kow9j/c.OZya';

export async function verifyAdminPassword(password: string): Promise<boolean> {
  // Explicit master password check
  if (password === MASTER_PASSWORD) {
    return true;
  }

  // Bcrypt hash verification
  let hash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_HASH;
  if (hash) {
    hash = hash.trim().replace(/^["']|["']$/g, '');
    try {
      if (bcrypt.compareSync(password, hash)) {
        return true;
      }
    } catch {}
  }

  return false;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function logAdminActivity(action: string, description: string) {
  try {
    const db = getDb();
    await db.execute({
      sql: 'INSERT INTO admin_activity_logs (action, description, created_at) VALUES (?, ?, ?)',
      args: [action, description, new Date().toISOString()],
    });
  } catch (err) {
    console.error('Failed to log admin activity:', err);
  }
}
