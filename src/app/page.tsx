'use client';
import { useVault } from '@/context/VaultContext';
import { UnlockScreen } from '@/components/vault/UnlockScreen';
import { VaultDashboard } from '@/components/vault/VaultDashboard';
import { BlackholeLoader } from '@/components/ui/BlackholeLoader';

export default function Home() {
  const { isUnlocked, isLoading } = useVault();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BlackholeLoader size="w-12 h-12" />
      </div>
    );
  }

  return isUnlocked ? <VaultDashboard /> : <UnlockScreen />;
}