'use client';
import { useVault } from '@/context/VaultContext';
import { UnlockScreen } from '@/components/vault/UnlockScreen';
import { VaultDashboard } from '@/components/vault/VaultDashboard';

export default function Home() {
  const { isUnlocked, isLoading } = useVault();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isUnlocked ? <VaultDashboard /> : <UnlockScreen />;
}