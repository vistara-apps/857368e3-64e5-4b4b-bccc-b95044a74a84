'use client';

import { useState } from 'react';
import { Plus, TrendingUp, AlertTriangle, Settings2 } from 'lucide-react';
import { PoolData } from '@/lib/types';
import { formatCurrency, formatPercentage, getRiskColor, getRiskLabel } from '@/lib/utils';

interface LPPositionManagerProps {
  pools: PoolData[];
}

export function LPPositionManager({ pools }: LPPositionManagerProps) {
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [showAddPosition, setShowAddPosition] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">LP Positions</h2>
          <p className="text-text-secondary">Manage your liquidity provider positions</p>
        </div>
        <button
          onClick={() => setShowAddPosition(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      {/* Positions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool, index) => (
          <div
            key={`${pool.protocol}-${pool.pair}`}
            className="glass-card-hover p-6 cursor-pointer"
            onClick={() => setSelectedPool(pool)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-text-primary">{pool.pair}</h3>
                <p className="text-sm text-text-secondary">{pool.protocol}</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${getRiskColor(pool.riskScore).replace('text-', 'bg-')}`} />
                <span className={`text-xs ${getRiskColor(pool.riskScore)}`}>
                  {getRiskLabel(pool.riskScore)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">APY</span>
                <span className="font-bold text-success">
                  {formatPercentage(pool.apy)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">TVL</span>
                <span className="font-mono text-text-primary">
                  {formatCurrency(pool.tvl)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">24h Volume</span>
                <span className="font-mono text-text-primary">
                  {formatCurrency(pool.volume24h)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">24h Fees</span>
                <span className="font-mono text-success">
                  {formatCurrency(pool.fees24h)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-text-secondary">Active</span>
                </div>
                <button className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Position Modal */}
      {showAddPosition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">Add LP Position</h3>
              <button
                onClick={() => setShowAddPosition(false)}
                className="text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Select Protocol
                </label>
                <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-text-primary">
                  <option>Uniswap V3</option>
                  <option>Aerodrome</option>
                  <option>BaseSwap</option>
                  <option>SushiSwap</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Token Pair
                </label>
                <input
                  type="text"
                  placeholder="e.g., WETH/USDC"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-text-primary placeholder-text-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Amount Token A
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-text-primary placeholder-text-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Amount Token B
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-text-primary placeholder-text-secondary"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddPosition(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button className="flex-1 btn-primary">
                  Add Position
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position Details Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary">{selectedPool.pair}</h3>
                <p className="text-text-secondary">{selectedPool.protocol}</p>
              </div>
              <button
                onClick={() => setSelectedPool(null)}
                className="text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="metric-card">
                  <p className="text-text-secondary text-sm">Current APY</p>
                  <p className="text-xl font-bold text-success">
                    {formatPercentage(selectedPool.apy)}
                  </p>
                </div>
                <div className="metric-card">
                  <p className="text-text-secondary text-sm">Risk Score</p>
                  <p className={`text-xl font-bold ${getRiskColor(selectedPool.riskScore)}`}>
                    {selectedPool.riskScore}/100
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Value Locked</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(selectedPool.tvl)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">24h Volume</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(selectedPool.volume24h)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">24h Fees Earned</span>
                  <span className="font-mono text-success">
                    {formatCurrency(selectedPool.fees24h)}
                  </span>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-warning font-medium text-sm">Risk Assessment</p>
                    <p className="text-text-secondary text-sm mt-1">
                      {getRiskLabel(selectedPool.riskScore)} - Monitor for impermanent loss and protocol changes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button className="flex-1 btn-secondary">
                  Remove Position
                </button>
                <button className="flex-1 btn-primary">
                  Manage Position
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
