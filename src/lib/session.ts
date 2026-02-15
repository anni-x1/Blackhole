import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  email?: string;
  username?: string;
  sessionId?: string;
  isLoggedIn: boolean;
}

if (!process.env.SESSION_PASSWORD) {
  throw new Error("SESSION_PASSWORD environment variable is not set.");
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD,
  cookieName: 'blackhole-session',
  ttl: 0,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }

  return session;
}
