'use client';
import { useVault } from '@/context/VaultContext';
import { VaultEntry } from '@/types/vault';
import { X, Plus, Trash, Zap, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { generateUUID } from '@/lib/crypto';
import { motion, AnimatePresence } from 'framer-motion';

interface AddEditModalProps {
  type: 'password' | 'api';
  entry?: VaultEntry;
  isOpen: boolean;
  onClose: () => void;
}

export function AddEditModal({ type, entry, isOpen, onClose }: AddEditModalProps) {
  const { vaultData, saveVault } = useVault();
  
  const [service, setService] = useState(entry?.service || '');
  const [username, setUsername] = useState(entry?.username || '');
  const [secret, setSecret] = useState(type === 'password' ? entry?.password || '' : entry?.apikey || '');
  const [remarks, setRemarks] = useState(entry?.remarks || '');
  const [custom, setCustom] = useState<{key: string, value: string}[]>(
    entry?.custom ? Object.entries(entry.custom).map(([k, v]) => ({ key: k, value: v })) : []
  );
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    setIsGenerating(true);
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const length = 24;
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length];
    }
    setSecret(password);
    setTimeout(() => setIsGenerating(false), 400);
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
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg p-7 rounded-2xl flex flex-col max-h-[90vh] overflow-y-auto bg-[#1D1C19] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#D97757] font-medium mb-1">
                <Sparkles className="w-3 h-3" />
                <span>{type === 'password' ? 'Password Credential' : 'API Token'}</span>
              </div>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-[#FAF7F2]">
                {entry ? 'Edit Credential' : 'Add New Credential'}
              </h2>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-white/5 text-slate-500 hover:text-[#FAF7F2] transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Service / Resource Name</label>
              <input 
                className="w-full py-2.5 px-3.5 text-sm bg-[#161614] border border-white/10 focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 rounded-xl text-white outline-none" 
                value={service} 
                onChange={e => setService(e.target.value)}
                placeholder="e.g. Anthropic API, GitHub, AWS Console"
                autoFocus
              />
            </div>

            {type === 'password' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">Username or Email</label>
                <input 
                  className="w-full py-2.5 px-3.5 text-sm bg-[#161614] border border-white/10 focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 rounded-xl font-sans text-white outline-none" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  placeholder="name@domain.com or handle"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                {type === 'password' ? 'Master Password' : 'API Token / Secret Key'}
              </label>
              <div className="flex gap-2">
                <input 
                  className="w-full py-2.5 px-3.5 text-sm font-mono bg-[#161614] border border-white/10 focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 rounded-xl text-[#E49275] outline-none" 
                  value={secret} 
                  onChange={e => setSecret(e.target.value)}
                  type="text"
                  placeholder={type === 'password' ? 'Passcode or phrase...' : 'sk-ant-...'}
                />
                {type === 'password' && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button" 
                    onClick={handleGeneratePassword}
                    className="px-3.5 py-2 rounded-xl bg-[#D97757]/10 hover:bg-[#D97757]/20 border border-[#D97757]/25 text-[#D97757] transition-all flex items-center gap-1.5 text-xs font-medium shrink-0" 
                    title="Generate High Entropy Passphrase"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Generate</span>
                  </motion.button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Notes & Operational Context</label>
              <textarea 
                className="w-full min-h-[72px] py-2.5 px-3.5 text-sm bg-[#161614] border border-white/10 focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15 rounded-xl resize-none text-white outline-none" 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional recovery instructions, scopes, or rotation schedule..."
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-500 font-medium">Custom Attributes</label>
                <button 
                  type="button"
                  onClick={() => setCustom([...custom, { key: '', value: '' }])}
                  className="text-xs text-[#D97757] hover:text-[#E28567] flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" /> Add Attribute
                </button>
              </div>

              {custom.map((c, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input 
                    placeholder="KEY (e.g. env)" 
                    className="flex-1 py-1.5 px-3 text-xs uppercase font-mono bg-[#161614] border border-white/10 focus:border-[#D97757] rounded-lg text-white outline-none"
                    value={c.key}
                    onChange={e => {
                      const newCustom = [...custom];
                      newCustom[i].key = e.target.value;
                      setCustom(newCustom);
                    }}
                  />
                  <input 
                    placeholder="VALUE (e.g. production)" 
                    className="flex-1 py-1.5 px-3 text-xs bg-[#161614] border border-white/10 focus:border-[#D97757] rounded-lg text-white outline-none"
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
                    className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="text-red-300 text-xs py-2 px-3 rounded-lg bg-red-950/20 border border-red-500/25 text-center">
                {error}
              </div>
            )}

            <div className="pt-4 flex gap-3 border-t border-white/5 mt-5">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-2.5 rounded-full bg-[#24231E] hover:bg-[#2B2A24] text-xs font-medium text-slate-400 hover:text-[#FAF7F2] border border-white/10 transition-all"
              >
                Cancel
              </button>
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                className="flex-1 py-2.5 rounded-full bg-[#D97757] hover:bg-[#E28567] text-xs font-medium text-[#FAF7F2] shadow-[0_4px_16px_rgba(217,119,87,0.3)] transition-all"
              >
                Save Credential
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
