'use client';
import { useVault } from '@/context/VaultContext';
import { VaultEntry } from '@/types/vault';
import { Copy, Eye, EyeOff, Trash2, Edit2, Check, Code, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddEditModal } from './AddEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Reorder } from 'framer-motion';

export function ApisList({ search }: { search: string }) {
  const { vaultData, saveVault } = useVault();
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);

  // Local state for immediate UI feedback during drag
  const [items, setItems] = useState<VaultEntry[]>([]);

  // Sync local items with vaultData when not dragging/searching
  useEffect(() => {
    if (vaultData?.apis) {
      setItems(vaultData.apis);
    }
  }, [vaultData?.apis]);

  const filteredEntries = items.filter(p => 
    p.service.toLowerCase().includes(search.toLowerCase())
  );

  const handleReorder = (newOrder: VaultEntry[]) => {
    setItems(newOrder);
    if (vaultData) {
        saveVault({
            ...vaultData,
            apis: newOrder
        });
    }
  };

  const isReorderEnabled = search.trim() === '';

  return (
    <div className="space-y-3 pb-20">
      {filteredEntries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <Code className="w-8 h-8 mx-auto mb-3 text-secondary opacity-50" />
            <p className="text-sm text-secondary">No API keys stored</p>
        </div>
      ) : (
        isReorderEnabled ? (
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="grid gap-2">
                {items.map(entry => (
                    <Reorder.Item key={entry.id} value={entry}>
                        <ApiRow 
                        entry={entry} 
                        onEdit={() => setEditingEntry(entry)}
                        onDelete={() => setDeletingEntry(entry)}
                        dragHandle={true}
                        />
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        ) : (
            <div className="grid gap-2">
                {filteredEntries.map(entry => (
                    <ApiRow 
                    key={entry.id} 
                    entry={entry} 
                    onEdit={() => setEditingEntry(entry)}
                    onDelete={() => setDeletingEntry(entry)}
                    dragHandle={false}
                    />
                ))}
            </div>
        )
      )}

      {editingEntry && (
        <AddEditModal 
          type="api" 
          entry={editingEntry} 
          isOpen={true} 
          onClose={() => setEditingEntry(null)} 
        />
      )}

      {deletingEntry && (
        <ConfirmDeleteModal 
          entry={deletingEntry}
          type="api"
          isOpen={true} 
          onClose={() => setDeletingEntry(null)} 
        />
      )}
    </div>
  );
}

function ApiRow({ entry, onEdit, onDelete, dragHandle }: { entry: VaultEntry, onEdit: () => void, onDelete: () => void, dragHandle: boolean }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!entry.apikey) return;
    await navigator.clipboard.writeText(entry.apikey);
    setCopied(true);
    setTimeout(() => {
        navigator.clipboard.writeText(''); 
        setCopied(false);
    }, 15000);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-[#0a0a0a] border border-white/5 hover:border-white/10 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all select-none">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {dragHandle && (
            <div className="cursor-grab active:cursor-grabbing text-secondary hover:text-white p-1">
                <GripVertical className="w-4 h-4" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-white truncate">{entry.service}</h3>
            <div className="flex items-center gap-2 mt-0.5">
                {entry.custom?.env && <span className="text-[10px] bg-white/5 text-secondary px-1.5 py-0.5 rounded border border-white/5">{entry.custom.env}</span>}
                <p className="text-secondary text-xs truncate">{entry.remarks || 'API Token'}</p>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="mr-4 w-32 flex justify-end">
             <span className={`font-mono text-xs ${isRevealed ? 'text-blue-400' : 'text-secondary'}`}>
                {isRevealed ? entry.apikey : 'sk_••••••••'}
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