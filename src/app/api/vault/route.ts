import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Vault from '@/models/Vault';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
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
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { vault: envelope } = await request.json();
    
    await connectDB();

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
