'use client';
import { useVault } from '@/context/VaultContext';
import { VaultEntry } from '@/types/vault';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDeleteModal({ entry, type, isOpen, onClose }: { entry: VaultEntry, type: 'password'|'api', isOpen: boolean, onClose: () => void }) {
  const { vaultData, saveVault } = useVault();

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!vaultData) return;
    
    const newVault = { ...vaultData };
    if (type === 'password') {
        newVault.passwords = newVault.passwords.filter(p => p.id !== entry.id);
    } else {
        newVault.apis = newVault.apis.filter(p => p.id !== entry.id);
    }
    
    await saveVault(newVault);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border-red-500/30 shadow-red-900/20">
        <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h3 className="text-xl font-bold">Delete Entry?</h3>
            <p className="text-slate-400 text-sm">
                Are you sure you want to permanently delete 
                <span className="text-white font-medium"> {entry.service}</span>?
                <br/>This action cannot be undone.
            </p>

            <div className="flex gap-3 w-full pt-2">
                <button onClick={onClose} className="flex-1 glass-button py-2 bg-transparent hover:bg-white/10 border-white/10">
                    Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 glass-button py-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-200">
                    Delete
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
