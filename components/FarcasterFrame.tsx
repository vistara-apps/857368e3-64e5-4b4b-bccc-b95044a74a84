'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Bookmark, Share2, ExternalLink } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { ExchangeRate } from '@/lib/types';
import { fetchExchangeRates, getCachedData, setCachedData } from '@/lib/api';

interface FarcasterFrameProps {
  variant?: 'default' | 'compact' | 'rate-check' | 'watchlist';
  tokenPair?: string;
  title?: string;
  showActions?: boolean;
  onSave?: () => void;
  onShare?: () => void;
}

export function FarcasterFrame({
  variant = 'default',
  tokenPair = 'WETH/USDC',
  title,
  showActions = true,
  onSave,
  onShare,
}: FarcasterFrameProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRates = async (force = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const cacheKey = `rates-${tokenPair}`;
      let rateData = force ? null : getCachedData(cacheKey);

      if (!rateData) {
        rateData = await fetchExchangeRates(tokenPair);
        setCachedData(cacheKey, rateData);
      }

      setRates(rateData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch rates');
      console.error('Error loading rates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, [tokenPair]);

  const bestRate = rates.length > 0 ? rates.reduce((best, current) => 
    current.rate > best.rate ? current : best
  ) : null;

  const worstRate = rates.length > 0 ? rates.reduce((worst, current) => 
    current.rate < worst.rate ? current : worst
  ) : null;

  const spread = bestRate && worstRate ? 
    ((bestRate.rate - worstRate.rate) / worstRate.rate) * 100 : 0;

  if (variant === 'compact') {
    return (
      <div className="glass-card p-4 rounded-lg max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">LL</span>
            </div>
            <span className="font-medium text-text-primary text-sm">{tokenPair}</span>
          </div>
          <button
            onClick={() => loadRates(true)}
            disabled={isLoading}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error ? (
          <div className="text-error text-sm text-center py-2">
            {error}
          </div>
        ) : bestRate ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-xs">Best Rate</span>
              <span className="text-success font-bold text-sm">
                {formatCurrency(bestRate.rate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-xs">Exchange</span>
              <span className="text-text-primary text-xs">{bestRate.exchange}</span>
            </div>
            {spread > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-xs">Spread</span>
                <span className="text-warning text-xs">{formatPercentage(spread)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-text-secondary text-sm text-center py-2">
            Loading rates...
          </div>
        )}
      </div>
    );
  }

  if (variant === 'rate-check') {
    return (
      <div className="glass-card p-6 rounded-xl max-w-md">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {title || `${tokenPair} Rate Check`}
            </h3>
            <p className="text-text-secondary text-sm">
              Real-time rates across Base DEXs
            </p>
          </div>

          {error ? (
            <div className="text-error text-sm">{error}</div>
          ) : bestRate ? (
            <div className="space-y-3">
              <div className="glass-card p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(bestRate.rate)}
                  </div>
                  <div className="text-text-secondary text-sm">
                    Best rate on {bestRate.exchange}
                  </div>
                </div>
              </div>

              {spread > 0.1 && (
                <div className="text-warning text-sm text-center">
                  ⚠️ {formatPercentage(spread)} spread across exchanges
                </div>
              )}
            </div>
          ) : (
            <div className="text-text-secondary">Loading...</div>
          )}

          {showActions && (
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => loadRates(true)}
                disabled={isLoading}
                className="btn-secondary flex-1 text-sm py-2"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {onSave && (
                <button
                  onClick={onSave}
                  className="btn-secondary px-3 py-2"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant - full frame
  return (
    <div className="glass-card p-6 rounded-xl max-w-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">LL</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {title || 'LiquidityLink'}
              </h3>
              <p className="text-text-secondary text-sm">
                {tokenPair} Rate Comparison
              </p>
            </div>
          </div>
          
          <button
            onClick={() => loadRates(true)}
            disabled={isLoading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-8">
            <div className="text-error mb-2">Failed to load rates</div>
            <button
              onClick={() => loadRates(true)}
              className="btn-secondary text-sm"
            >
              Try Again
            </button>
          </div>
        ) : rates.length > 0 ? (
          <div className="space-y-4">
            {/* Best Rate Highlight */}
            {bestRate && (
              <div className="glass-card p-4 rounded-lg neon-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-success font-bold text-xl">
                      {formatCurrency(bestRate.rate)}
                    </div>
                    <div className="text-text-secondary text-sm">
                      Best rate on {bestRate.exchange}
                    </div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            )}

            {/* All Rates */}
            <div className="space-y-2">
              {rates.map((rate, index) => (
                <div
                  key={rate.exchange}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    rate.exchange === bestRate?.exchange
                      ? 'glass-card border border-success/30'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {rate.exchange.charAt(0)}
                      </span>
                    </div>
                    <span className="text-text-primary font-medium text-sm">
                      {rate.exchange}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-text-primary font-mono text-sm">
                      {formatCurrency(rate.rate)}
                    </div>
                    {bestRate && rate.exchange !== bestRate.exchange && (
                      <div className="text-text-secondary text-xs">
                        -{formatPercentage(((bestRate.rate - rate.rate) / bestRate.rate) * 100)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            {spread > 0 && (
              <div className="glass-card p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Price Spread</span>
                  <span className={`font-medium ${spread > 1 ? 'text-warning' : 'text-text-primary'}`}>
                    {formatPercentage(spread)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <span className="text-white font-bold">LL</span>
            </div>
            <div className="text-text-secondary">Loading rates...</div>
          </div>
        )}

        {/* Actions */}
        {showActions && rates.length > 0 && (
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onSave}
              className="btn-secondary flex-1 text-sm"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Save Rate
            </button>
            <button
              onClick={onShare}
              className="btn-secondary flex-1 text-sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            {bestRate && (
              <button
                onClick={() => window.open(`https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=USDC`, '_blank')}
                className="btn-primary px-4 text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Trade
              </button>
            )}
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-center text-text-secondary text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
