'use client';

import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { useVault } from '@/context/VaultContext';
import {
  downloadTextFile,
  makePlainVaultExport,
  mergeVaults,
  parseCsvImport,
  parseJsonImport,
} from '@/lib/vault-transfer';
import { Upload, Download, X, FileJson, FileSpreadsheet, Shield } from 'lucide-react';

interface DataTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataTransferModal({ isOpen, onClose }: DataTransferModalProps) {
  const { vaultData, saveVault, exportEncryptedVault } = useVault();
  const [mode, setMode] = useState<'replace' | 'merge'>('merge');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !vaultData) return null;

  const handleExportJson = () => {
    const payload = makePlainVaultExport(vaultData);
    downloadTextFile(
      `blackhole-export-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    setMessage('Plain JSON export downloaded.');
    setError(null);
  };

  const handleExportBackup = async () => {
    try {
      setIsWorking(true);
      const payload = await exportEncryptedVault();
      downloadTextFile(
        `blackhole-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(payload, null, 2),
        'application/json'
      );
      setMessage('Encrypted backup downloaded.');
      setError(null);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Failed to create backup');
      setMessage(null);
    } finally {
      setIsWorking(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsWorking(true);
      setError(null);
      setMessage(null);
      const text = await file.text();

      const importedVault = file.name.toLowerCase().endsWith('.csv')
        ? parseCsvImport(text)
        : parseJsonImport(text);

      const nextVault = mode === 'replace'
        ? {
            ...importedVault,
            meta: { version: vaultData.meta.version + 1 },
          }
        : mergeVaults(vaultData, importedVault);

      await saveVault(nextVault);
      setMessage(
        mode === 'replace'
          ? 'Vault replaced with imported data.'
          : 'Imported data merged into the current vault.'
      );
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed');
    } finally {
      setIsWorking(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#090909] p-6 shadow-[0_0_60px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Import / Export Vault</h2>
            <p className="mt-1 text-sm text-secondary">
              Download backups or import JSON and CSV data directly on this device.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-secondary transition-colors hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-white" />
              <h3 className="text-sm font-semibold text-white">Export</h3>
            </div>
            <p className="mt-2 text-sm text-secondary">
              Choose between a readable JSON export or an encrypted backup tied to your vault passcode.
            </p>

            <div className="mt-5 space-y-3">
              <button
                onClick={handleExportJson}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-medium text-white">Plain JSON Export</p>
                  <p className="mt-1 text-xs text-secondary">Best for migrations and inspection.</p>
                </div>
                <FileJson className="h-4 w-4 text-secondary" />
              </button>

              <button
                onClick={handleExportBackup}
                disabled={isWorking}
                className="flex w-full items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-left transition-colors hover:bg-blue-500/15 disabled:opacity-60"
              >
                <div>
                  <p className="text-sm font-medium text-white">Encrypted Backup</p>
                  <p className="mt-1 text-xs text-secondary">Keeps the downloaded vault encrypted at rest.</p>
                </div>
                <Shield className="h-4 w-4 text-blue-300" />
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-white" />
              <h3 className="text-sm font-semibold text-white">Import</h3>
            </div>
            <p className="mt-2 text-sm text-secondary">
              Accepts Blackhole JSON exports, raw vault JSON, or CSV with columns like service, username, password, remarks, apikey, and type.
            </p>

            <div className="mt-5 flex gap-2 rounded-xl border border-white/10 bg-black/40 p-1">
              <button
                onClick={() => setMode('merge')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${mode === 'merge' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
              >
                Merge
              </button>
              <button
                onClick={() => setMode('replace')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${mode === 'replace' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
              >
                Replace
              </button>
            </div>

            <button
              onClick={handleImportClick}
              disabled={isWorking}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 disabled:opacity-60"
            >
              <div>
                <p className="text-sm font-medium text-white">Choose Import File</p>
                <p className="mt-1 text-xs text-secondary">
                  {mode === 'replace' ? 'Current vault will be overwritten.' : 'Imported entries will be prepended to the current vault.'}
                </p>
              </div>
              <FileSpreadsheet className="h-4 w-4 text-secondary" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              className="hidden"
              onChange={handleImportFile}
            />
          </section>
        </div>

        {(error || message) && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-500/20 bg-red-950/20 text-red-300'
                : 'border-emerald-500/20 bg-emerald-950/20 text-emerald-300'
            }`}
          >
            {error || message}
          </div>
        )}
      </div>
    </div>
  );
}
