'use client';
import { useState } from 'react';
import { useVault } from '@/context/VaultContext';
import { PasswordsList } from './PasswordsList';
import { ApisList } from './ApisList';
import { Playground } from './Playground';
import { LogOut, Plus, Search } from 'lucide-react';
import { AddEditModal } from './AddEditModal';
import { motion } from 'framer-motion';

type Tab = 'passwords' | 'apis' | 'playground';

export function VaultDashboard() {
  const { logout, user } = useVault();
  const [activeTab, setActiveTab] = useState<Tab>('passwords');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <div className="w-2 h-2 bg-black rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Blackhole</h1>
            <p className="text-xs text-secondary font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button onClick={logout} className="void-button-secondary p-2 rounded-lg text-secondary hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
            </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
         <nav className="flex gap-1 p-1 bg-[#111] rounded-lg border border-white/5">
            {(['passwords', 'apis', 'playground'] as const).map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-secondary hover:text-white'
                }`}
            >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
            ))}
        </nav>

        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="void-input w-full pl-9 py-1.5 text-xs bg-[#0a0a0a]"
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="void-button px-3 py-1.5 text-xs flex items-center gap-2 whitespace-nowrap"
                disabled={activeTab === 'playground'}
            >
                <Plus className="w-3.5 h-3.5" /> New Entry
            </button>
        </div>
      </div>

      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'passwords' && <PasswordsList search={searchQuery} />}
        {activeTab === 'apis' && <ApisList search={searchQuery} />}
        {activeTab === 'playground' && <Playground />}
      </motion.main>

      {isAddModalOpen && activeTab !== 'playground' && (
        <AddEditModal 
          type={activeTab === 'apis' ? 'api' : 'password'} 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}
    </div>
  );
}
