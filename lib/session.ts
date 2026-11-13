import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface AdminSessionData {
  isAdmin?: boolean;
  username?: string;
  loginAt?: number;
}

const DEFAULT_SECRET = 'gdg_upes_session_secret_at_least_32_characters_long_super_secure!';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || DEFAULT_SECRET,
  cookieName: 'gdg_upes_admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return null;
  }
  // Enforce session timeout (8 hours)
  if (session.loginAt && Date.now() - session.loginAt > 8 * 60 * 60 * 1000) {
    session.destroy();
    return null;
  }
  return session;
}

