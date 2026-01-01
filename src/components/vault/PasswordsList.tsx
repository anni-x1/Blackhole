'use client';
import { useVault } from '@/context/VaultContext';
import { VaultEntry } from '@/types/vault';
import { Copy, Eye, EyeOff, Trash2, Edit2, Check, Shield } from 'lucide-react';
import { useState } from 'react';
import { AddEditModal } from './AddEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function PasswordsList({ search }: { search: string }) {
  const { vaultData } = useVault();
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);

  const entries = vaultData?.passwords.filter(p => 
    p.service.toLowerCase().includes(search.toLowerCase()) || 
    p.username?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-3 pb-20">
      {entries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
          <Shield className="w-8 h-8 mx-auto mb-3 text-secondary opacity-50" />
          <p className="text-sm text-secondary">No passwords stored</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {entries.map(entry => (
            <PasswordRow 
              key={entry.id} 
              entry={entry} 
              onEdit={() => setEditingEntry(entry)}
              onDelete={() => setDeletingEntry(entry)}
            />
          ))}
        </div>
      )}

      {editingEntry && (
        <AddEditModal 
          type="password" 
          entry={editingEntry} 
          isOpen={true} 
          onClose={() => setEditingEntry(null)} 
        />
      )}

      {deletingEntry && (
        <ConfirmDeleteModal 
          entry={deletingEntry}
          type="password"
          isOpen={true} 
          onClose={() => setDeletingEntry(null)} 
        />
      )}
    </div>
  );
}

function PasswordRow({ entry, onEdit, onDelete }: { entry: VaultEntry, onEdit: () => void, onDelete: () => void }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!entry.password) return;
    await navigator.clipboard.writeText(entry.password);
    setCopied(true);
    setTimeout(() => {
        navigator.clipboard.writeText(''); 
        setCopied(false);
    }, 15000);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-[#0a0a0a] border border-white/5 hover:border-white/10 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-white truncate">{entry.service}</h3>
        <p className="text-secondary text-xs truncate mt-0.5">{entry.username}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="mr-4 w-32 flex justify-end">
             <span className={`font-mono text-xs ${isRevealed ? 'text-blue-400' : 'text-secondary'}`}>
                {isRevealed ? entry.password : '••••••••••••'}
            </span>
        </div>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsRevealed(!isRevealed)} className="p-1.5 hover:bg-white/10 rounded text-secondary hover:text-white transition-colors">
                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded text-secondary hover:text-green-400 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <div className="w-px h-3 bg-white/10 mx-1" />

            <button onClick={onEdit} className="p-1.5 hover:bg-white/10 rounded text-secondary hover:text-blue-400 transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button onClick={onDelete} className="p-1.5 hover:bg-white/10 rounded text-secondary hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>
    </div>
  );
}