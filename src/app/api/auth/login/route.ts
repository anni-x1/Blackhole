import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
    
    // 5 attempts per 15 minutes
    const limitResult = rateLimit(ip);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const { emailOrUsername, keyAuth } = await request.json();

    if (typeof emailOrUsername !== 'string' || typeof keyAuth !== 'string') {
      return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
    }

    const identifier = emailOrUsername.trim();
    if (!identifier) {
      return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
    }

    await connectDB();

    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await User.findOne({ email: identifier.toLowerCase() })
      : await User.findOne({ username: identifier.toLowerCase() });

    if (!user) {
      // TIMING ATTACK PREVENTION:
      // Run a dummy comparison so the request takes the same amount of time
      // as if a user was found. We use a fixed hash to compare against.
      const dummyHash = '$2b$12$v017k6mGKW7JsASF3FImuuIDk5T6Ud5hmZmPISLllbxQJCqILHTuG'; // Valid bcrypt hash
      await bcrypt.compare(keyAuth, dummyHash);
      
      console.log('User not found in login (timing safe)');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('User found, verifying hash...');
    const isValid = await bcrypt.compare(keyAuth, user.passwordHash);

    if (!isValid) {
      console.log('Password verification failed');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = await getSession();

    // SINGLE SESSION ENFORCEMENT
    const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const isSessionActive = user.activeSessionId && 
                            user.lastActiveAt && 
                            (Date.now() - new Date(user.lastActiveAt).getTime() < SESSION_TIMEOUT_MS);

    // Block if session is active AND it's not the same session as the one in the current cookie.
    // This allows users to re-login (unlock) after a page reload without waiting for timeout.
    if (isSessionActive && user.activeSessionId !== session.sessionId) {
      const lastActiveDate = new Date(user.lastActiveAt);
      const secondsAgo = Math.floor((Date.now() - lastActiveDate.getTime()) / 1000);
      const timeStr = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo/60)}m ago`;
      
      return NextResponse.json({ 
        error: `Account already in use on another device (Active ${timeStr}). Please log out there first or wait 5 minutes.` 
      }, { status: 403 });
    }

    // Generate a unique ID for this specific session
    const newSessionId = crypto.randomUUID();

    console.log('Login successful for:', user.email);

    user.activeSessionId = newSessionId;
    user.lastActiveAt = new Date();
    await user.save();

    session.userId = user._id.toString();
    session.email = user.email;
    session.username = user.username;
    session.isLoggedIn = true;
    session.sessionId = newSessionId;
    await session.save();

    return NextResponse.json({ ok: true, email: user.email, username: user.username });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}