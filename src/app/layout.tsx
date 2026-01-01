import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './main.css';
import { VaultProvider } from '@/context/VaultContext';
import { StarsBackground } from '@/components/ui/StarsBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blackhole Vault',
  description: 'Zero-Knowledge Secure Vault',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VaultProvider>
          <StarsBackground />
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
        </VaultProvider>
      </body>
    </html>
  );
}