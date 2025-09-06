'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { AuthUser, AuthContextType, generateUserId, validateWalletAddress } from '@/lib/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected: wagmiConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Initialize user when wallet connects
  useEffect(() => {
    if (wagmiConnected && address && validateWalletAddress(address)) {
      const authUser: AuthUser = {
        walletAddress: address,
        userId: generateUserId(address),
        createdAt: new Date(),
        isConnected: true,
      };
      setUser(authUser);
      setError(null);
      
      // Store user session in localStorage
      localStorage.setItem('liquiditylink_user', JSON.stringify(authUser));
    } else if (!wagmiConnected) {
      setUser(null);
      localStorage.removeItem('liquiditylink_user');
    }
    setIsLoading(false);
  }, [wagmiConnected, address]);

  // Restore user session on app load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('liquiditylink_user');
      if (storedUser && !wagmiConnected) {
        const parsedUser = JSON.parse(storedUser);
        // Only restore if the session is recent (within 24 hours)
        const sessionAge = Date.now() - new Date(parsedUser.createdAt).getTime();
        if (sessionAge < 24 * 60 * 60 * 1000) {
          setUser({ ...parsedUser, createdAt: new Date(parsedUser.createdAt) });
        } else {
          localStorage.removeItem('liquiditylink_user');
        }
      }
    } catch (error) {
      console.error('Error restoring user session:', error);
      localStorage.removeItem('liquiditylink_user');
    }
    setIsLoading(false);
  }, [wagmiConnected]);

  const handleConnect = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Use the first available connector (usually MetaMask or Coinbase Wallet)
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      } else {
        throw new Error('No wallet connector available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    try {
      wagmiDisconnect();
      setUser(null);
      setError(null);
      localStorage.removeItem('liquiditylink_user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isConnected: wagmiConnected && !!user,
    connect: handleConnect,
    disconnect: handleDisconnect,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
