import connectDB from '@/lib/db';
import User from '@/models/User';
import type { SessionData } from '@/lib/session';

/**
 * Validates the session against the database (userId + sessionId match)
 * and refreshes lastActiveAt. Returns the user or null if invalid.
 */
export async function validateAndRefreshSession(session: SessionData): Promise<InstanceType<typeof User> | null> {
  if (!session.isLoggedIn || !session.userId) return null;

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return null;

  const userSessionId = user.activeSessionId;
  if (userSessionId !== session.sessionId) return null;

  user.lastActiveAt = new Date();
  await user.save();
  return user;
}
