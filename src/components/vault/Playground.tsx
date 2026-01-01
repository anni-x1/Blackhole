'use client';
import { useVault } from '@/context/VaultContext';
import { useState, useEffect } from 'react';
import { Save, Lock, FileText } from 'lucide-react';

export function Playground() {
  const { vaultData, saveVault } = useVault();
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (vaultData) {
        setContent(vaultData.playground?.scratch || '');
    }
  }, [vaultData]);

  const handleSave = async () => {
    if (!vaultData) return;
    const newVault = { ...vaultData };
    newVault.playground = { scratch: content };
    newVault.meta.version++;
    await saveVault(newVault);
    setIsDirty(false);
  };

  return (
    <div className="h-[600px] flex flex-col gap-4 pb-20">
        <div className="flex justify-between items-center glass-card p-3 px-4 rounded-lg bg-black/40">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Encrypted Buffer // Scratchpad</span>
            </div>
            <button 
                onClick={handleSave} 
                disabled={!isDirty}
                className={`glass-button py-2 px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition-all ${!isDirty ? 'opacity-30 cursor-not-allowed' : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'}`}
            >
                <Save className="w-4 h-4" /> Save Changes
            </button>
        </div>
        
        <div className="relative flex-1">
            <div className="absolute top-4 right-4 pointer-events-none opacity-20">
                <Lock className="w-24 h-24 text-white" />
            </div>
            <textarea
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    setIsDirty(true);
                }}
                className="w-full h-full glass-card p-8 rounded-xl bg-black/60 focus:outline-none resize-none font-mono text-sm leading-relaxed text-slate-300 placeholder:text-slate-700 border-white/10 focus:border-blue-500/30 transition-colors"
                placeholder="> INITIATE SECURE NOTE..."
                spellCheck={false}
            />
        </div>
    </div>
  );
}
