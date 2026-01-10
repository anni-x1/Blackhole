import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST() {
  const session = await getSession();
  
  if (session.userId) {
    await connectDB();
    await User.findByIdAndUpdate(session.userId, {
      activeSessionId: null,
      lastActiveAt: null
    });
  }

  session.destroy();
  return NextResponse.json({ ok: true });
}
