import { describe, expect, it } from 'vitest';
import { auditPasswords } from './password-audit';

describe('password-audit', () => {
  it('flags weak, reused, and stale passwords', () => {
    const result = auditPasswords([
      {
        id: '1',
        service: 'GitHub',
        username: 'anni',
        password: 'password123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        service: 'AWS',
        username: 'anni',
        password: 'password123',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      {
        id: '3',
        service: 'Linear',
        username: 'anni',
        password: 'TrulyStrong!987',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ]);

    expect(result.summary.total).toBe(3);
    expect(result.summary.reused).toBe(2);
    expect(result.summary.stale).toBeGreaterThanOrEqual(1);
    expect(result.summary.weak).toBeGreaterThanOrEqual(1);
    expect(result.items[0].issues.length).toBeGreaterThan(0);
  });
});
