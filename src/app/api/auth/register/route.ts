import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { email, authSalt, keyAuth } = await request.json();

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