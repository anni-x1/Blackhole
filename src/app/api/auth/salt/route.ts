import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { emailOrUsername } = await request.json();

    if (typeof emailOrUsername !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const identifier = emailOrUsername.trim();
    if (!identifier) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectDB();

    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await User.findOne({ email: identifier.toLowerCase() }).select('authSalt')
      : await User.findOne({ username: identifier.toLowerCase() }).select('authSalt');

    if (!user) {
      const fakeSalt = crypto
        .createHmac('sha256', process.env.SESSION_PASSWORD || 'fallback_secret')
        .update(identifier)
        .digest()
        .subarray(0, 16)
        .toString('base64');
      return NextResponse.json({ salt: fakeSalt });
    }

    return NextResponse.json({ salt: user.authSalt });
  } catch (e) {
    console.error('Error in /api/auth/salt:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}