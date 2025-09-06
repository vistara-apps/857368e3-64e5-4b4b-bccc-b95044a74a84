'use client';

import { useState } from 'react';
import { Wallet, LogOut, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { truncateAddress } from '@/lib/auth';

export function WalletConnect() {
  const { user, isLoading, isConnected, connect, disconnect, error } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-surface rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-surface rounded animate-pulse" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end space-y-2">
        <button
          onClick={connect}
          disabled={isLoading}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect Wallet</span>
        </button>
        {error && (
          <div className="flex items-center space-x-1 text-error text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="glass-card-hover px-4 py-2 rounded-lg flex items-center space-x-3"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-text-primary">
            {truncateAddress(user?.walletAddress || '')}
          </div>
          <div className="text-xs text-text-secondary">
            Connected
          </div>
        </div>
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 glass-card rounded-lg shadow-modal z-20 p-4">
            <div className="space-y-4">
              {/* User Info */}
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {truncateAddress(user?.walletAddress || '', 6)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      User ID: {user?.userId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Stats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Connected Since</span>
                  <span className="text-text-primary">
                    {user?.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Network</span>
                  <span className="text-success">Base</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-white/10 pt-3">
                <button
                  onClick={() => {
                    disconnect();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
