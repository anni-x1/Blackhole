'use client';
import { useVault } from '@/context/VaultContext';
import { VaultEntry } from '@/types/vault';
import { X, RefreshCw, Plus, Trash, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateUUID } from '@/lib/crypto';

interface AddEditModalProps {
  type: 'password' | 'api';
  entry?: VaultEntry;
  isOpen: boolean;
  onClose: () => void;
}

export function AddEditModal({ type, entry, isOpen, onClose }: AddEditModalProps) {
  const { vaultData, saveVault } = useVault();
  
  const [service, setService] = useState('');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [remarks, setRemarks] = useState('');
  const [custom, setCustom] = useState<{key: string, value: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setService(entry.service);
      setUsername(entry.username || '');
      setSecret(type === 'password' ? entry.password || '' : entry.apikey || '');
      setRemarks(entry.remarks || '');
      if (entry.custom) {
        setCustom(Object.entries(entry.custom).map(([k, v]) => ({ key: k, value: v })));
      }
    } else {
      setService('');
      setUsername('');
      setSecret('');
      setRemarks('');
      setCustom([]);
    }
  }, [entry, type, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const length = 24;
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[values[i] % charset.length];
    }
    setSecret(password);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !secret) {
      setError('Service and Secret are required');
      return;
    }
    
    if (!vaultData) return;

    const customObj: Record<string, string> = {};
    custom.forEach(c => {
      if (c.key) customObj[c.key] = c.value;
    });

    const newEntry: VaultEntry = {
      id: entry ? entry.id : generateUUID(),
      service,
      username: type === 'password' ? username : undefined,
      password: type === 'password' ? secret : undefined,
      apikey: type === 'api' ? secret : undefined,
      remarks,
      custom: Object.keys(customObj).length > 0 ? customObj : undefined,
      createdAt: entry ? entry.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newVault = { ...vaultData };
    
    if (entry) {
      if (type === 'password') {
        newVault.passwords = newVault.passwords.map(p => p.id === entry.id ? newEntry : p);
      } else {
        newVault.apis = newVault.apis.map(p => p.id === entry.id ? newEntry : p);
      }
    } else {
      if (type === 'password') {
        newVault.passwords.unshift(newEntry);
      } else {
        newVault.apis.unshift(newEntry);
      }
    }
    
    newVault.meta.version++;
    
    try {
      await saveVault(newVault);
      onClose();
    } catch (e) {
      setError('Failed to save');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg p-8 rounded-2xl flex flex-col max-h-[90vh] overflow-y-auto border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white">
            {entry ? 'Update' : 'New'} <span className="text-blue-400">{type === 'password' ? 'Credentials' : 'API Token'}</span>
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Service Identity</label>
            <input 
              className="glass-input w-full bg-black/50" 
              value={service} 
              onChange={e => setService(e.target.value)}
              placeholder="e.g. AWS_PRODUCTION"
              autoFocus
            />
          </div>

          {type === 'password' && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Username / Email</label>
              <input 
                className="glass-input w-full bg-black/50" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="root@system"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">{type === 'password' ? 'Secure Password' : 'API Secret'}</label>
            <div className="flex gap-2">
              <input 
                className="glass-input w-full font-mono text-sm bg-black/50 text-blue-300" 
                value={secret} 
                onChange={e => setSecret(e.target.value)}
                type="text"
                placeholder={type === 'password' ? '••••••••' : 'sk-...'}
              />
              {type === 'password' && (
                <button 
                  type="button" 
                  onClick={handleGeneratePassword}
                  className="glass-button p-2 hover:bg-blue-500/20 hover:border-blue-500/40 text-blue-300" 
                  title="Generate Strong Password"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Metadata / Remarks</label>
            <textarea 
              className="glass-input w-full min-h-[80px] bg-black/50 text-sm" 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)}
              placeholder="Operational notes..."
            />
          </div>

          {/* Custom Fields */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Extended Attributes</label>
            {custom.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input 
                  placeholder="KEY" 
                  className="glass-input flex-1 text-xs uppercase bg-black/50"
                  value={c.key}
                  onChange={e => {
                    const newCustom = [...custom];
                    newCustom[i].key = e.target.value;
                    setCustom(newCustom);
                  }}
                />
                <input 
                  placeholder="VALUE" 
                  className="glass-input flex-1 text-xs bg-black/50"
                  value={c.value}
                  onChange={e => {
                    const newCustom = [...custom];
                    newCustom[i].value = e.target.value;
                    setCustom(newCustom);
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setCustom(custom.filter((_, idx) => idx !== i))}
                  className="text-slate-600 hover:text-red-400 p-2"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button 
              type="button"
              onClick={() => setCustom([...custom, { key: '', value: '' }])}
              className="text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
            >
              <Plus className="w-3 h-3" /> Add Field
            </button>
          </div>

          {error && <div className="text-red-400 text-xs font-mono bg-red-500/10 p-2 rounded border border-red-500/20 text-center">{error}</div>}

          <div className="pt-6 flex gap-3 border-t border-white/5 mt-4">
             <button type="button" onClick={onClose} className="flex-1 glass-button py-3 bg-transparent hover:bg-white/5 border-white/10 text-xs uppercase tracking-widest">
                Abort
             </button>
             <button type="submit" className="flex-1 glass-button-primary py-3 text-xs uppercase tracking-widest font-bold">
                Confirm Save
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
