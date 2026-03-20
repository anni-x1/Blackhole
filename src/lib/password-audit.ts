import type { VaultEntry } from '@/types/vault';

export interface PasswordAuditItem {
  entry: VaultEntry;
  score: number;
  strengthLabel: 'weak' | 'fair' | 'strong';
  issues: string[];
  reusedWith: string[];
  ageDays: number;
}

export interface PasswordAuditSummary {
  total: number;
  weak: number;
  reused: number;
  stale: number;
  healthy: number;
  averageScore: number;
}

export interface PasswordAuditResult {
  summary: PasswordAuditSummary;
  items: PasswordAuditItem[];
}

const STALE_AFTER_DAYS = 180;

function getPasswordScore(password: string): number {
  let score = 0;

  if (password.length >= 12) score += 35;
  else if (password.length >= 8) score += 20;
  else if (password.length >= 1) score += 5;

  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (/password|qwerty|admin|1234|letmein/i.test(password)) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function getStrengthLabel(score: number): PasswordAuditItem['strengthLabel'] {
  if (score >= 75) return 'strong';
  if (score >= 45) return 'fair';
  return 'weak';
}

function getAgeDays(updatedAt: string): number {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return 0;
  const diffMs = Date.now() - updated.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function auditPasswords(entries: VaultEntry[]): PasswordAuditResult {
  const passwordMap = new Map<string, VaultEntry[]>();

  for (const entry of entries) {
    if (!entry.password) continue;
    const bucket = passwordMap.get(entry.password) ?? [];
    bucket.push(entry);
    passwordMap.set(entry.password, bucket);
  }

  const items = entries
    .filter((entry) => typeof entry.password === 'string' && entry.password.length > 0)
    .map((entry) => {
      const password = entry.password as string;
      const score = getPasswordScore(password);
      const reusedWith = (passwordMap.get(password) ?? [])
        .filter((candidate) => candidate.id !== entry.id)
        .map((candidate) => candidate.service);
      const ageDays = getAgeDays(entry.updatedAt);
      const issues: string[] = [];

      if (password.length < 12) issues.push('Shorter than 12 characters');
      if (!/[A-Z]/.test(password)) issues.push('Missing uppercase letters');
      if (!/[a-z]/.test(password)) issues.push('Missing lowercase letters');
      if (!/[0-9]/.test(password)) issues.push('Missing numbers');
      if (!/[^A-Za-z0-9]/.test(password)) issues.push('Missing symbols');
      if (reusedWith.length > 0) issues.push(`Reused with ${reusedWith.join(', ')}`);
      if (ageDays >= STALE_AFTER_DAYS) issues.push(`Not updated in ${ageDays} days`);

      return {
        entry,
        score,
        strengthLabel: getStrengthLabel(score),
        issues,
        reusedWith,
        ageDays,
      };
    })
    .sort((a, b) => {
      if (a.issues.length !== b.issues.length) return b.issues.length - a.issues.length;
      return a.score - b.score;
    });

  const summary = items.reduce<PasswordAuditSummary>((acc, item) => {
    acc.total += 1;
    if (item.strengthLabel === 'weak') acc.weak += 1;
    if (item.reusedWith.length > 0) acc.reused += 1;
    if (item.ageDays >= STALE_AFTER_DAYS) acc.stale += 1;
    if (item.issues.length === 0) acc.healthy += 1;
    acc.averageScore += item.score;
    return acc;
  }, {
    total: 0,
    weak: 0,
    reused: 0,
    stale: 0,
    healthy: 0,
    averageScore: 0,
  });

  if (summary.total > 0) {
    summary.averageScore = Math.round(summary.averageScore / summary.total);
  }

  return { summary, items };
}
