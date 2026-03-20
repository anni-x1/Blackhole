import type { PlaintextVault, VaultEntry, VaultEnvelope } from '@/types/vault';
import { generateUUID } from '@/lib/crypto';

export interface PlainVaultExport {
  format: 'blackhole-vault-json';
  version: 1;
  exportedAt: string;
  vault: PlaintextVault;
}

export interface EncryptedVaultExport {
  format: 'blackhole-vault-backup';
  version: 1;
  exportedAt: string;
  vault: VaultEnvelope;
}

function normalizeEntry(base: Partial<VaultEntry>, fallbackType: 'password' | 'api'): VaultEntry {
  const now = new Date().toISOString();
  const custom = base.custom && typeof base.custom === 'object' ? base.custom : undefined;

  return {
    id: typeof base.id === 'string' && base.id ? base.id : generateUUID(),
    service: typeof base.service === 'string' && base.service.trim() ? base.service.trim() : 'Imported Entry',
    username: typeof base.username === 'string' ? base.username : undefined,
    password: fallbackType === 'password' && typeof base.password === 'string' ? base.password : undefined,
    apikey: fallbackType === 'api' && typeof base.apikey === 'string' ? base.apikey : undefined,
    remarks: typeof base.remarks === 'string' ? base.remarks : undefined,
    custom,
    createdAt: typeof base.createdAt === 'string' && base.createdAt ? base.createdAt : now,
    updatedAt: typeof base.updatedAt === 'string' && base.updatedAt ? base.updatedAt : now,
  };
}

export function normalizePlaintextVault(input: unknown): PlaintextVault {
  const source = input as Partial<PlaintextVault> | undefined;
  const passwords = Array.isArray(source?.passwords)
    ? source.passwords.map((entry) => normalizeEntry(entry, 'password'))
    : [];
  const apis = Array.isArray(source?.apis)
    ? source.apis.map((entry) => normalizeEntry(entry, 'api'))
    : [];
  const scratch = typeof source?.playground?.scratch === 'string' ? source.playground.scratch : '';
  const version = typeof source?.meta?.version === 'number' ? source.meta.version : 1;

  return {
    passwords,
    apis,
    playground: { scratch },
    meta: { version },
  };
}

export function makePlainVaultExport(vault: PlaintextVault): PlainVaultExport {
  return {
    format: 'blackhole-vault-json',
    version: 1,
    exportedAt: new Date().toISOString(),
    vault,
  };
}

export function downloadTextFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseCsvImport(csv: string): PlaintextVault {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV file must include a header row and at least one item');
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const typeIndex = headers.indexOf('type');
  const serviceIndex = headers.indexOf('service');
  const usernameIndex = headers.indexOf('username');
  const passwordIndex = headers.indexOf('password');
  const apiKeyIndex = headers.indexOf('apikey');
  const remarksIndex = headers.indexOf('remarks');

  if (serviceIndex === -1) {
    throw new Error('CSV import requires a service column');
  }

  const result: PlaintextVault = {
    passwords: [],
    apis: [],
    playground: { scratch: '' },
    meta: { version: 1 },
  };

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const typeRaw = typeIndex >= 0 ? cells[typeIndex]?.toLowerCase() : 'password';
    const entryType = typeRaw === 'api' ? 'api' : 'password';

    const entry = normalizeEntry({
      service: cells[serviceIndex],
      username: usernameIndex >= 0 ? cells[usernameIndex] : undefined,
      password: passwordIndex >= 0 ? cells[passwordIndex] : undefined,
      apikey: apiKeyIndex >= 0 ? cells[apiKeyIndex] : undefined,
      remarks: remarksIndex >= 0 ? cells[remarksIndex] : undefined,
    }, entryType);

    if (entryType === 'password') {
      if (!entry.password) continue;
      result.passwords.push(entry);
    } else {
      if (!entry.apikey) continue;
      result.apis.push(entry);
    }
  }

  result.meta.version = Math.max(1, result.passwords.length + result.apis.length);
  return result;
}

export function parseJsonImport(json: string): PlaintextVault {
  const parsed = JSON.parse(json) as Partial<PlainVaultExport & EncryptedVaultExport> | PlaintextVault;

  if ((parsed as any).format === 'blackhole-vault-json') {
    return normalizePlaintextVault((parsed as any).vault);
  }

  if ((parsed as any).format === 'blackhole-vault-backup') {
    throw new Error('Encrypted backup imports are not supported yet. Export one as plain JSON to re-import it.');
  }

  return normalizePlaintextVault(parsed);
}

export function mergeVaults(currentVault: PlaintextVault, importedVault: PlaintextVault): PlaintextVault {
  const nowVersion = Math.max(currentVault.meta.version, importedVault.meta.version) + 1;

  return {
    passwords: [...importedVault.passwords, ...currentVault.passwords],
    apis: [...importedVault.apis, ...currentVault.apis],
    playground: importedVault.playground.scratch ? importedVault.playground : currentVault.playground,
    meta: { version: nowVersion },
  };
}
