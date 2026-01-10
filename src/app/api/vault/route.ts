import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Vault from '@/models/Vault';
import User from '@/models/User';
import { getSession } from '@/lib/session';

async function validateAndRefreshSession(session: any) {
  if (!session.isLoggedIn || !session.userId) return null;
  
  await connectDB();
  const user = await User.findById(session.userId);
  
  // @ts-ignore
  if (!user || user.activeSessionId !== session.sessionId) {
    return null;
  }

  // Update last seen to keep the session alive
  user.lastActiveAt = new Date();
  await user.save();
  return user;
}

export async function GET() {
  const session = await getSession();
  const user = await validateAndRefreshSession(session);
  if (!user) {
    return NextResponse.json({ error: 'Session expired or active on another device' }, { status: 401 });
  }

  try {
    const vault = await Vault.findOne({ user: session.userId });

    if (!vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    return NextResponse.json({ vault });
  } catch (e) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const user = await validateAndRefreshSession(session);
  if (!user) {
    return NextResponse.json({ error: 'Session expired or active on another device' }, { status: 401 });
  }

  try {
    const { vault: envelope } = await request.json();
    
    const existingVault = await Vault.findOne({ user: session.userId });

    if (existingVault) {
        // Optimistic Locking: Simple increment for now
        existingVault.ciphertext = envelope.ciphertext;
        existingVault.iv = envelope.iv;
        existingVault.salt = envelope.salt;
        existingVault.kdfParams = {
            kdf: envelope.kdf,
            iterations: envelope.iterations
        };
        existingVault.version += 1;
        await existingVault.save();
    } else {
        await Vault.create({
            user: session.userId,
            ciphertext: envelope.ciphertext,
            iv: envelope.iv,
            salt: envelope.salt,
            kdfParams: {
                kdf: envelope.kdf,
                iterations: envelope.iterations
            }
        });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Vault save error:', e);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
