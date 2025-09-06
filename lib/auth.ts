import { createContext, useContext } from 'react';

export interface AuthUser {
  walletAddress: string;
  userId: string;
  createdAt: Date;
  isConnected: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function generateUserId(walletAddress: string): string {
  // Generate a deterministic user ID based on wallet address
  return `user_${walletAddress.toLowerCase().slice(2, 10)}`;
}

export function validateWalletAddress(address: string): boolean {
  // Basic Ethereum address validation
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
