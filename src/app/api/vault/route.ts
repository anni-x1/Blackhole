import { NextResponse } from 'next/server';
import Vault from '@/models/Vault';
import { getSession } from '@/lib/session';
import { validateAndRefreshSession } from '@/lib/session-validate';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

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
  } catch (err) {
    console.error('Vault fetch error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const user = await validateAndRefreshSession(session);
  if (!user) {
    return NextResponse.json({ error: 'Session expired or active on another device' }, { status: 401 });
  }

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
  
  // Rate limit vault updates: 10 per minute
  const limitResult = rateLimit(ip, { limit: 10, windowMs: 60 * 1000 });
  if (!limitResult.success) {
    return NextResponse.json({ error: 'Too many vault updates. Please try again later.' }, { status: 429 });
  }

  try {
    const { vault: envelope } = await request.json();

    if (!envelope || !envelope.ciphertext) {
      return NextResponse.json({ error: 'Invalid vault data' }, { status: 400 });
    }

    // Check for storage exhaustion: Max 500,000 characters for ciphertext
    if (envelope.ciphertext.length > 500000) {
      return NextResponse.json({ error: 'Vault too large' }, { status: 413 });
    }
    
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
  } catch (err) {
    console.error('Vault save error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
