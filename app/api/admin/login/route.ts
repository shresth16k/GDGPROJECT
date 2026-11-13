import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, logAdminActivity } from '@/lib/auth';
import { getAdminSession } from '@/lib/session';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  const rateLimit = await checkRateLimit(ip, 'admin_login', 50, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  const valid = await verifyAdminPassword(parsed.data.password);

  if (!valid) {
    return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isAdmin = true;
  session.username = 'admin';
  session.loginAt = Date.now();
  await session.save();

  await logAdminActivity('admin_login', 'Administrator successfully authenticated');

  return NextResponse.json({ success: true });
}
