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

    // 5 registrations per hour
    const limitResult = rateLimit(ip, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const { email, authSalt, keyAuth } = await request.json();

    if (typeof email !== 'string' || typeof authSalt !== 'string' || typeof keyAuth !== 'string') {
      return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
    }

    if (!email || !authSalt || !keyAuth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash the Key_Auth before storing it
    const passwordHash = await bcrypt.hash(keyAuth, 12);

    const user = await User.create({
      email,
      authSalt,
      passwordHash,
    });

    const session = await getSession();
    session.userId = user._id.toString();
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}