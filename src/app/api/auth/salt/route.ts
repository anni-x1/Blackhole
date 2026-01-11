import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (typeof email !== 'string') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    await connectDB();
    
    const user = await User.findOne({ email }).select('authSalt');

    if (!user) {
      // Generate a deterministic fake salt based on the email
      // This ensures the "fake" salt is consistent for the same email
      // but useless for actual decryption.
      const fakeSalt = crypto
        .createHmac('sha256', process.env.SESSION_PASSWORD || 'fallback_secret')
        .update(email)
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