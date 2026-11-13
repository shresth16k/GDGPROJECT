import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, logAdminActivity } from '@/lib/auth';
import { getAdminSession } from '@/lib/session';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Rate limiting with graceful fallback
    try {
      const rateLimit = await checkRateLimit(ip, 'admin_login', 50, 10 * 60 * 1000);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please wait a moment before trying again.' },
          { status: 429 }
        );
      }
    } catch (rateErr) {
      console.warn('Rate limit check skipped due to error:', rateErr);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const valid = await verifyAdminPassword(parsed.data.password);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
    }

    // Establish secure admin session
    const session = await getAdminSession();
    session.isAdmin = true;
    session.username = 'admin';
    session.loginAt = Date.now();
    await session.save();

    // Log admin login activity safely without blocking response
    logAdminActivity('admin_login', 'Administrator successfully authenticated').catch((err) => {
      console.warn('Admin activity logging non-critical error:', err);
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unhandled admin login error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error during authentication. Please retry.' },
      { status: 500 }
    );
  }
}
