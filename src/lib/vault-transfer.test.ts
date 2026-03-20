import { describe, expect, it } from 'vitest';
import { mergeVaults, normalizePlaintextVault, parseCsvImport, parseJsonImport } from './vault-transfer';

describe('vault-transfer', () => {
  it('normalizes partial vault data', () => {
    const vault = normalizePlaintextVault({
      passwords: [{ service: 'GitHub', password: 'abcDEF123!!!' }],
    });

    expect(vault.passwords).toHaveLength(1);
    expect(vault.passwords[0].id).toBeTruthy();
    expect(vault.apis).toEqual([]);
    expect(vault.playground.scratch).toBe('');
  });

  it('parses csv imports', () => {
    const vault = parseCsvImport([
      'type,service,username,password,apikey,remarks',
      'password,GitHub,anni,strongpass,,primary login',
      'api,OpenAI,,,sk-123,prod key',
    ].join('\n'));

    expect(vault.passwords).toHaveLength(1);
    expect(vault.apis).toHaveLength(1);
    expect(vault.passwords[0].service).toBe('GitHub');
    expect(vault.apis[0].apikey).toBe('sk-123');
  });

  it('parses blackhole json exports', () => {
    const vault = parseJsonImport(JSON.stringify({
      format: 'blackhole-vault-json',
      version: 1,
      exportedAt: '2026-03-20T00:00:00.000Z',
      vault: {
        passwords: [{ service: 'Notion', password: 'abcDEF123!!!' }],
        apis: [],
        playground: { scratch: 'note' },
        meta: { version: 4 },
      },
    }));

    expect(vault.passwords[0].service).toBe('Notion');
    expect(vault.playground.scratch).toBe('note');
  });

  it('merges imported data ahead of current data', () => {
    const merged = mergeVaults(
      normalizePlaintextVault({
        passwords: [{ service: 'Current', password: 'current-pass-123A!' }],
      }),
      normalizePlaintextVault({
        passwords: [{ service: 'Imported', password: 'import-pass-123A!' }],
      })
    );

    expect(merged.passwords).toHaveLength(2);
    expect(merged.passwords[0].service).toBe('Imported');
    expect(merged.passwords[1].service).toBe('Current');
  });
});
