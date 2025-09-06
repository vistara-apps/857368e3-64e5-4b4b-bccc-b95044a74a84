'use client';

import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { getConfig } from '@coinbase/onchainkit/wagmi';
import { base } from 'wagmi/chains';
import { type ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={getConfig({ apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'cdp_demo_key' })}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          chain={base}
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'cdp_demo_key'}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
