import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
