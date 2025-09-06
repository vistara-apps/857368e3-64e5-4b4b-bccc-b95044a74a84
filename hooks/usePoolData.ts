'use client';

import { useState, useEffect, useCallback } from 'react';
import { uniswapAPI, UniswapPool, PoolHourlyData } from '@/lib/api/uniswap';
import { config } from '@/lib/config';

export interface PoolData {
  protocol: string;
  pair: string;
  apy: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  riskScore: number;
  poolAddress?: string;
  token0Address?: string;
  token1Address?: string;
}

export interface UsePoolDataReturn {
  pools: PoolData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function usePoolData(limit: number = 10): UsePoolDataReturn {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const transformUniswapPoolToPoolData = useCallback(
    async (uniPool: UniswapPool): Promise<PoolData> => {
      try {
        // Get hourly data for APY calculation
        const hourlyData = await uniswapAPI.getPoolHourlyData(uniPool.id, 24);
        const apy = uniswapAPI.calculatePoolAPY(uniPool, hourlyData);

        // Calculate 24h fees from hourly data
        const fees24h = hourlyData.length > 0 
          ? hourlyData.slice(0, 24).reduce((sum, data) => sum + parseFloat(data.feesUSD), 0)
          : parseFloat(uniPool.feesUSD);

        return {
          protocol: 'Uniswap V3',
          pair: `${uniPool.token0.symbol}/${uniPool.token1.symbol}`,
          apy: apy || 0,
          tvl: parseFloat(uniPool.tvlUSD),
          volume24h: parseFloat(uniPool.volumeUSD),
          fees24h,
          riskScore: config.protocols.uniswapV3.riskScore,
          poolAddress: uniPool.id,
          token0Address: uniPool.token0.id,
          token1Address: uniPool.token1.id,
        };
      } catch (error) {
        console.error('Error transforming pool data:', error);
        // Return basic data if detailed calculation fails
        return {
          protocol: 'Uniswap V3',
          pair: `${uniPool.token0.symbol}/${uniPool.token1.symbol}`,
          apy: 0,
          tvl: parseFloat(uniPool.tvlUSD),
          volume24h: parseFloat(uniPool.volumeUSD),
          fees24h: parseFloat(uniPool.feesUSD),
          riskScore: config.protocols.uniswapV3.riskScore,
          poolAddress: uniPool.id,
          token0Address: uniPool.token0.id,
          token1Address: uniPool.token1.id,
        };
      }
    },
    []
  );

  const fetchPools = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch top pools by TVL from Uniswap V3
      const uniswapPools = await uniswapAPI.getTopPoolsByTVL(limit);
      
      // Transform Uniswap pools to our PoolData format
      const transformedPools = await Promise.all(
        uniswapPools.map(transformUniswapPoolToPoolData)
      );

      // Filter out pools with very low TVL or invalid data
      const validPools = transformedPools.filter(pool => 
        pool.tvl > 1000 && // Minimum $1k TVL
        pool.pair && 
        !isNaN(pool.tvl) && 
        !isNaN(pool.volume24h)
      );

      setPools(validPools);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pool data';
      setError(errorMessage);
      console.error('Error fetching pool data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit, transformUniswapPoolToPoolData]);

  // Initial fetch
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPools();
    }, config.cache.poolDataTTL * 1000);

    return () => clearInterval(interval);
  }, [fetchPools]);

  return {
    pools,
    isLoading,
    error,
    refetch: fetchPools,
    lastUpdated,
  };
}

export function usePoolDataForPair(token0: string, token1: string): UsePoolDataReturn {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const transformUniswapPoolToPoolData = useCallback(
    async (uniPool: UniswapPool): Promise<PoolData> => {
      try {
        const hourlyData = await uniswapAPI.getPoolHourlyData(uniPool.id, 24);
        const apy = uniswapAPI.calculatePoolAPY(uniPool, hourlyData);

        const fees24h = hourlyData.length > 0 
          ? hourlyData.slice(0, 24).reduce((sum, data) => sum + parseFloat(data.feesUSD), 0)
          : parseFloat(uniPool.feesUSD);

        return {
          protocol: 'Uniswap V3',
          pair: `${uniPool.token0.symbol}/${uniPool.token1.symbol}`,
          apy: apy || 0,
          tvl: parseFloat(uniPool.tvlUSD),
          volume24h: parseFloat(uniPool.volumeUSD),
          fees24h,
          riskScore: config.protocols.uniswapV3.riskScore,
          poolAddress: uniPool.id,
          token0Address: uniPool.token0.id,
          token1Address: uniPool.token1.id,
        };
      } catch (error) {
        console.error('Error transforming pool data:', error);
        return {
          protocol: 'Uniswap V3',
          pair: `${uniPool.token0.symbol}/${uniPool.token1.symbol}`,
          apy: 0,
          tvl: parseFloat(uniPool.tvlUSD),
          volume24h: parseFloat(uniPool.volumeUSD),
          fees24h: parseFloat(uniPool.feesUSD),
          riskScore: config.protocols.uniswapV3.riskScore,
          poolAddress: uniPool.id,
          token0Address: uniPool.token0.id,
          token1Address: uniPool.token1.id,
        };
      }
    },
    []
  );

  const fetchPoolsForPair = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch pools for specific token pair
      const uniswapPools = await uniswapAPI.getPoolsForTokenPair(token0, token1);
      
      // Transform and sort by TVL
      const transformedPools = await Promise.all(
        uniswapPools.map(transformUniswapPoolToPoolData)
      );

      const validPools = transformedPools
        .filter(pool => pool.tvl > 100) // Lower threshold for specific pairs
        .sort((a, b) => b.tvl - a.tvl); // Sort by TVL descending

      setPools(validPools);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pool data for pair';
      setError(errorMessage);
      console.error('Error fetching pool data for pair:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token0, token1, transformUniswapPoolToPoolData]);

  useEffect(() => {
    if (token0 && token1) {
      fetchPoolsForPair();
    }
  }, [fetchPoolsForPair, token0, token1]);

  return {
    pools,
    isLoading,
    error,
    refetch: fetchPoolsForPair,
    lastUpdated,
  };
}
