import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { USERNAME_MIN_LEN, USERNAME_MAX_LEN, USERNAME_REGEX } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

function validateUsername(raw: string): { ok: true; username: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length < USERNAME_MIN_LEN) {
    return { ok: false, error: `Username must be at least ${USERNAME_MIN_LEN} characters` };
  }
  if (trimmed.length > USERNAME_MAX_LEN) {
    return { ok: false, error: `Username must be at most ${USERNAME_MAX_LEN} characters` };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { ok: false, error: 'Username can only contain letters, numbers, underscores and hyphens' };
  }
  return { ok: true, username: trimmed.toLowerCase() };
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';

    const limitResult = rateLimit(ip, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const { email, username: rawUsername, authSalt, keyAuth } = await request.json();

    if (typeof email !== 'string' || typeof authSalt !== 'string' || typeof keyAuth !== 'string') {
      return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
    }
    if (typeof rawUsername !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!email || !authSalt || !keyAuth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const usernameValidation = validateUsername(rawUsername);
    if (!usernameValidation.ok) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
    }
    const username = usernameValidation.username;

    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !emailNorm.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await connectDB();

    const [existingByEmail, existingByUsername] = await Promise.all([
      User.findOne({ email: emailNorm }),
      User.findOne({ username }),
    ]);
    if (existingByEmail) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }
    if (existingByUsername) {
      return NextResponse.json({ error: 'This username is already taken' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(keyAuth, 12);

    const user = await User.create({
      email: emailNorm,
      username,
      authSalt,
      passwordHash,
    });

    const newSessionId = crypto.randomUUID();
    user.activeSessionId = newSessionId;
    user.lastActiveAt = new Date();
    await user.save();

    const session = await getSession();
    session.userId = user._id.toString();
    session.email = user.email;
    session.username = user.username;
    session.sessionId = newSessionId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, email: user.email, username: user.username });
  } catch (error) {
    const e = error as { code?: number; message?: string };
    if (e.code === 11000) {
      const field = e.message?.includes('username') ? 'username' : 'email';
      return NextResponse.json({ error: field === 'username' ? 'This username is already taken' : 'An account with this email already exists' }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}