import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { logAdminActivity } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getAdminSession();
  await logAdminActivity('admin_logout', 'Administrator logged out');
  await session.destroy();
  return NextResponse.json({ success: true });
}
