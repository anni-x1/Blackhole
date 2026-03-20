'use client';

import { useMemo, useState } from 'react';
import { useVault } from '@/context/VaultContext';
import { auditPasswords } from '@/lib/password-audit';
import type { VaultEntry } from '@/types/vault';
import { AddEditModal } from './AddEditModal';
import { AlertTriangle, CheckCircle2, CopyCheck, Clock3, ShieldAlert } from 'lucide-react';

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: 'neutral' | 'danger' | 'success' | 'warn';
}) {
  const toneClasses = {
    neutral: 'border-white/10 text-white',
    danger: 'border-red-500/20 text-red-300',
    success: 'border-emerald-500/20 text-emerald-300',
    warn: 'border-amber-500/20 text-amber-300',
  };

  return (
    <div className={`rounded-xl border bg-black/40 p-4 ${toneClasses[tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-secondary">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-secondary">{hint}</p>
    </div>
  );
}

function scoreBarClass(score: number) {
  if (score >= 75) return 'bg-emerald-400';
  if (score >= 45) return 'bg-amber-400';
  return 'bg-red-400';
}

export function PasswordHealth() {
  const { vaultData } = useVault();
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);

  const audit = useMemo(
    () => auditPasswords(vaultData?.passwords ?? []),
    [vaultData?.passwords]
  );

  if (!vaultData || audit.summary.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-6 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-secondary opacity-60" />
        <h2 className="mt-4 text-lg font-medium text-white">No passwords to audit yet</h2>
        <p className="mt-2 text-sm text-secondary">
          Add a few password entries and Blackhole will flag weak, reused, and stale credentials here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Average Strength"
          value={`${audit.summary.averageScore}/100`}
          hint="Local score based on length and character variety."
          tone={audit.summary.averageScore >= 75 ? 'success' : audit.summary.averageScore >= 45 ? 'warn' : 'danger'}
        />
        <MetricCard
          label="Weak Passwords"
          value={audit.summary.weak}
          hint="Passwords that should be rotated first."
          tone={audit.summary.weak > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Reuse Alerts"
          value={audit.summary.reused}
          hint="Entries sharing the same password."
          tone={audit.summary.reused > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Stale Entries"
          value={audit.summary.stale}
          hint="Not updated in 180 days or more."
          tone={audit.summary.stale > 0 ? 'warn' : 'neutral'}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Password Audit</h2>
            <p className="mt-1 text-xs text-secondary">
              Healthy entries: {audit.summary.healthy} of {audit.summary.total}
            </p>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {audit.items.map((item) => (
            <div key={item.entry.id} className="px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate text-sm font-medium text-white">{item.entry.service}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-secondary">
                      {item.strengthLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-secondary">
                    {item.entry.username || 'No username saved'}
                  </p>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarClass(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.issues.length === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        No issues detected
                      </span>
                    ) : (
                      item.issues.map((issue) => (
                        <span
                          key={issue}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          {issue}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.reusedWith.length > 0 && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-200">
                      <CopyCheck className="h-3.5 w-3.5" />
                      Reused
                    </div>
                  )}
                  {item.ageDays >= 180 && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200">
                      <Clock3 className="h-3.5 w-3.5" />
                      {item.ageDays}d old
                    </div>
                  )}
                  <button
                    onClick={() => setEditingEntry(item.entry)}
                    className="void-button-secondary rounded-lg px-3 py-2 text-xs text-white"
                  >
                    Review Entry
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingEntry && (
        <AddEditModal
          type="password"
          entry={editingEntry}
          isOpen={true}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
