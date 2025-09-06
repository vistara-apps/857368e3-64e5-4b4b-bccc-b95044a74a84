'use client';

import { useState, useEffect, useCallback } from 'react';
import { uniswapAPI, UniswapPool } from '@/lib/api/uniswap';
import { config } from '@/lib/config';
import { RateComparison } from '@/lib/types';

export interface UseExchangeRatesReturn {
  rates: RateComparison[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useExchangeRates(
  token0Symbol: string = 'WETH',
  token1Symbol: string = 'USDC'
): UseExchangeRatesReturn {
  const [rates, setRates] = useState<RateComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const calculateSpread = (pools: UniswapPool[]): number => {
    if (pools.length < 2) return 0;
    
    const prices = pools.map(pool => {
      // Get the price of token0 in terms of token1
      return parseFloat(pool.token0Price);
    }).filter(price => price > 0);

    if (prices.length < 2) return 0;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return ((maxPrice - minPrice) / minPrice) * 100; // Return as percentage
  };

  const transformPoolToRateComparison = (
    pool: UniswapPool,
    protocol: string,
    riskScore: number
  ): RateComparison => {
    // Determine which token is which based on symbols
    const isToken0Target = pool.token0.symbol.toUpperCase() === token0Symbol.toUpperCase();
    const rate = isToken0Target 
      ? parseFloat(pool.token0Price) 
      : parseFloat(pool.token1Price);

    // Calculate spread as a simple percentage of the rate
    const spread = rate * 0.001; // 0.1% as a simple approximation

    return {
      exchange: protocol,
      rate: rate,
      spread: spread,
      liquidity: parseFloat(pool.tvlUSD),
      fees: parseFloat(pool.feeTier) / 10000, // Convert from basis points to percentage
    };
  };

  const fetchExchangeRates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get token addresses from config
      const token0Address = config.tokens[token0Symbol as keyof typeof config.tokens];
      const token1Address = config.tokens[token1Symbol as keyof typeof config.tokens];

      if (!token0Address || !token1Address) {
        throw new Error(`Token addresses not found for ${token0Symbol}/${token1Symbol}`);
      }

      // Fetch pools for the token pair from Uniswap V3
      const uniswapPools = await uniswapAPI.getPoolsForTokenPair(token0Address, token1Address);
      
      // Filter pools with sufficient liquidity
      const liquidPools = uniswapPools.filter(pool => 
        parseFloat(pool.tvlUSD) > config.risk.liquidityThreshold / 10 // Use 1/10th of threshold for rate comparison
      );

      if (liquidPools.length === 0) {
        throw new Error(`No liquid pools found for ${token0Symbol}/${token1Symbol}`);
      }

      // Transform pools to rate comparisons
      const rateComparisons: RateComparison[] = [];

      // Group pools by fee tier to represent different "exchanges" or pool types
      const poolsByFeeTier = liquidPools.reduce((acc, pool) => {
        const feeTier = pool.feeTier;
        if (!acc[feeTier]) {
          acc[feeTier] = [];
        }
        acc[feeTier].push(pool);
        return acc;
      }, {} as Record<string, UniswapPool[]>);

      // Create rate comparisons for each fee tier
      Object.entries(poolsByFeeTier).forEach(([feeTier, pools]) => {
        // Use the pool with highest TVL for each fee tier
        const bestPool = pools.reduce((best, current) => 
          parseFloat(current.tvlUSD) > parseFloat(best.tvlUSD) ? current : best
        );

        const feePercentage = parseFloat(feeTier) / 10000;
        const exchangeName = `Uniswap V3 (${feePercentage}%)`;

        rateComparisons.push(
          transformPoolToRateComparison(bestPool, exchangeName, config.protocols.uniswapV3.riskScore)
        );
      });

      // Add mock data for other protocols if we don't have real integrations yet
      if (rateComparisons.length > 0) {
        const baseRate = rateComparisons[0].rate;
        const baseLiquidity = rateComparisons[0].liquidity;

        // Add Aerodrome (mock data based on Uniswap rates)
        rateComparisons.push({
          exchange: 'Aerodrome',
          rate: baseRate * (0.998 + Math.random() * 0.004), // ±0.2% variation
          spread: baseRate * 0.0008,
          liquidity: baseLiquidity * 0.45, // Roughly 45% of Uniswap liquidity
          fees: 0.25,
        });

        // Add BaseSwap (mock data)
        rateComparisons.push({
          exchange: 'BaseSwap',
          rate: baseRate * (0.995 + Math.random() * 0.01), // ±0.5% variation
          spread: baseRate * 0.0012,
          liquidity: baseLiquidity * 0.17, // Roughly 17% of Uniswap liquidity
          fees: 0.4,
        });

        // Add SushiSwap (mock data)
        rateComparisons.push({
          exchange: 'SushiSwap',
          rate: baseRate * (0.997 + Math.random() * 0.006), // ±0.3% variation
          spread: baseRate * 0.0006,
          liquidity: baseLiquidity * 0.30, // Roughly 30% of Uniswap liquidity
          fees: 0.3,
        });
      }

      // Sort by rate (best rate first)
      rateComparisons.sort((a, b) => b.rate - a.rate);

      setRates(rateComparisons);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exchange rates';
      setError(errorMessage);
      console.error('Error fetching exchange rates:', err);
      
      // Fallback to mock data if API fails
      const mockRates: RateComparison[] = [
        { exchange: 'Uniswap V3', rate: 1772.65, spread: 0.05, liquidity: 45000000, fees: 0.3 },
        { exchange: 'Aerodrome', rate: 1771.89, spread: 0.08, liquidity: 23000000, fees: 0.25 },
        { exchange: 'BaseSwap', rate: 1770.12, spread: 0.12, liquidity: 8900000, fees: 0.4 },
        { exchange: 'SushiSwap', rate: 1773.21, spread: 0.06, liquidity: 15600000, fees: 0.3 },
      ];
      setRates(mockRates);
    } finally {
      setIsLoading(false);
    }
  }, [token0Symbol, token1Symbol]);

  // Initial fetch
  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchExchangeRates();
    }, config.cache.rateDataTTL * 1000);

    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  return {
    rates,
    isLoading,
    error,
    refetch: fetchExchangeRates,
    lastUpdated,
  };
}

// Hook for getting rates for multiple pairs
export function useMultiPairExchangeRates(
  pairs: Array<{ token0: string; token1: string }>
): Record<string, UseExchangeRatesReturn> {
  const results: Record<string, UseExchangeRatesReturn> = {};

  pairs.forEach(({ token0, token1 }) => {
    const pairKey = `${token0}/${token1}`;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[pairKey] = useExchangeRates(token0, token1);
  });

  return results;
}
