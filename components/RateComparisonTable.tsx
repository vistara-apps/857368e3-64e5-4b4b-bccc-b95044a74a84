'use client';

import { useState } from 'react';
import { ArrowUpDown, ExternalLink, Zap } from 'lucide-react';
import { RateComparison } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface RateComparisonTableProps {
  rates: RateComparison[];
  pair: string;
}

export function RateComparisonTable({ rates, pair }: RateComparisonTableProps) {
  const [sortBy, setSortBy] = useState<keyof RateComparison>('rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedRates = [...rates].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const handleSort = (key: keyof RateComparison) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const bestRate = Math.max(...rates.map(r => r.rate));

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-text-primary">Rate Comparison</h3>
          <p className="text-text-secondary text-sm">Best rates for {pair}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-warning" />
          <span className="text-sm text-text-secondary">Live rates</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-text-secondary font-medium">
                <button
                  onClick={() => handleSort('exchange')}
                  className="flex items-center space-x-1 hover:text-text-primary transition-colors duration-200"
                >
                  <span>Exchange</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium">
                <button
                  onClick={() => handleSort('rate')}
                  className="flex items-center space-x-1 hover:text-text-primary transition-colors duration-200 ml-auto"
                >
                  <span>Rate</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium">
                <button
                  onClick={() => handleSort('spread')}
                  className="flex items-center space-x-1 hover:text-text-primary transition-colors duration-200 ml-auto"
                >
                  <span>Spread</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium">
                <button
                  onClick={() => handleSort('liquidity')}
                  className="flex items-center space-x-1 hover:text-text-primary transition-colors duration-200 ml-auto"
                >
                  <span>Liquidity</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="text-right py-3 px-4 text-text-secondary font-medium">
                <button
                  onClick={() => handleSort('fees')}
                  className="flex items-center space-x-1 hover:text-text-primary transition-colors duration-200 ml-auto"
                >
                  <span>Fees</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="text-center py-3 px-4 text-text-secondary font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRates.map((rate, index) => (
              <tr
                key={rate.exchange}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors duration-200 ${
                  rate.rate === bestRate ? 'bg-success/10' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {rate.exchange.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{rate.exchange}</p>
                      {rate.rate === bestRate && (
                        <span className="text-xs text-success font-medium">Best Rate</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-mono text-text-primary">
                    {formatCurrency(rate.rate)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-text-secondary">
                    {formatPercentage(rate.spread)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-text-secondary">
                    {formatCurrency(rate.liquidity)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-text-secondary">
                    {formatPercentage(rate.fees)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <button className="btn-secondary text-sm py-2 px-4 flex items-center space-x-1 mx-auto">
                    <span>Trade</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
