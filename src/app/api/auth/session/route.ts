import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { validateAndRefreshSession } from '@/lib/session-validate';

/**
 * GET /api/auth/session
 * Returns current user identity if session is valid; 401 otherwise.
 * Use for initial load and periodic/visibility-based session checks.
 */
export async function GET() {
  const session = await getSession();
  const user = await validateAndRefreshSession(session);
  if (!user) {
    return NextResponse.json({ error: 'Session expired or active on another device' }, { status: 401 });
  }
  return NextResponse.json({
    email: user.email,
    username: user.username,
  });
}
