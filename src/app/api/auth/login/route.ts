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

    const { email, keyAuth } = await request.json();

    if (typeof email !== 'string' || typeof keyAuth !== 'string') {
      return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
    }

    await connectDB();

    console.log('Login attempt for:', email);
    const user = await User.findOne({ email });

    if (!user) {
      // TIMING ATTACK PREVENTION:
      // Run a dummy comparison so the request takes the same amount of time
      // as if a user was found. We use a fixed hash to compare against.
      const dummyHash = '$2b$12$v017k6mGKW7JsASF3FImuuIDk5T6Ud5hmZmPISLllbxQJCqILHTuG'; // Valid bcrypt hash
      await bcrypt.compare(keyAuth, dummyHash);
      
      console.log('User not found in login (timing safe):', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('User found, verifying hash...');
    const isValid = await bcrypt.compare(keyAuth, user.passwordHash);

    if (!isValid) {
      console.log('Password verification failed for:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // SINGLE SESSION ENFORCEMENT
    const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const isSessionActive = user.activeSessionId && 
                            user.lastActiveAt && 
                            (Date.now() - new Date(user.lastActiveAt).getTime() < SESSION_TIMEOUT_MS);

    if (isSessionActive) {
      return NextResponse.json({ 
        error: 'Account already in use on another device. Please log out there first or wait 5 minutes.' 
      }, { status: 403 });
    }

    // Generate a unique ID for this specific session
    const newSessionId = crypto.randomUUID();

    console.log('Login successful for:', email);
    const session = await getSession();
    
    // Update user with new session info
    user.activeSessionId = newSessionId;
    user.lastActiveAt = new Date();
    await user.save();

    session.userId = user._id.toString();
    session.email = user.email;
    session.isLoggedIn = true;
    // @ts-expect-error - adding custom field to session
    session.sessionId = newSessionId;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}