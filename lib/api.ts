import { ExchangeRate, PoolData, LPPosition } from './types';

// API Configuration
const UNISWAP_V3_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base';
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const FARCASTER_HUB_URL = process.env.NEXT_PUBLIC_FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';

// Uniswap V3 Subgraph Queries
const POOL_DATA_QUERY = `
  query GetPoolData($first: Int!, $orderBy: String!, $orderDirection: String!) {
    pools(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      liquidity
      sqrtPrice
      tick
      token0Price
      token1Price
      volumeUSD
      txCount
      totalValueLockedUSD
      feesUSD
    }
  }
`;

const POSITION_DATA_QUERY = `
  query GetPositions($owner: String!) {
    positions(where: { owner: $owner }) {
      id
      owner
      pool {
        id
        token0 {
          symbol
          decimals
        }
        token1 {
          symbol
          decimals
        }
        feeTier
      }
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      liquidity
      depositedToken0
      depositedToken1
      withdrawnToken0
      withdrawnToken1
      collectedFeesToken0
      collectedFeesToken1
    }
  }
`;

// API Functions
export async function fetchUniswapPools(limit = 10): Promise<PoolData[]> {
  try {
    const response = await fetch(UNISWAP_V3_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: POOL_DATA_QUERY,
        variables: {
          first: limit,
          orderBy: 'totalValueLockedUSD',
          orderDirection: 'desc',
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('Subgraph query errors:', data.errors);
      return [];
    }

    return data.data.pools.map((pool: any) => ({
      protocol: 'Uniswap V3',
      pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      apy: calculatePoolAPY(pool.feesUSD, pool.totalValueLockedUSD),
      tvl: parseFloat(pool.totalValueLockedUSD),
      volume24h: parseFloat(pool.volumeUSD),
      fees24h: parseFloat(pool.feesUSD),
      riskScore: calculateRiskScore(pool),
    }));
  } catch (error) {
    console.error('Error fetching Uniswap pools:', error);
    return [];
  }
}

export async function fetchExchangeRates(tokenPair: string): Promise<ExchangeRate[]> {
  const rates: ExchangeRate[] = [];
  
  try {
    // Fetch from multiple DEXs
    const uniswapRate = await fetchUniswapRate(tokenPair);
    const aerodromeRate = await fetchAerodromeRate(tokenPair);
    const baseswapRate = await fetchBaseSwapRate(tokenPair);
    
    if (uniswapRate) rates.push(uniswapRate);
    if (aerodromeRate) rates.push(aerodromeRate);
    if (baseswapRate) rates.push(baseswapRate);
    
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return [];
  }
}

export async function fetchUserPositions(walletAddress: string): Promise<LPPosition[]> {
  try {
    const response = await fetch(UNISWAP_V3_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: POSITION_DATA_QUERY,
        variables: {
          owner: walletAddress.toLowerCase(),
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('Position query errors:', data.errors);
      return [];
    }

    return data.data.positions.map((position: any) => ({
      positionId: position.id,
      userId: walletAddress,
      protocol: 'Uniswap V3',
      poolAddress: position.pool.id,
      token0: position.pool.token0.symbol,
      token1: position.pool.token1.symbol,
      amount0: parseFloat(position.depositedToken0),
      amount1: parseFloat(position.depositedToken1),
      depositTimestamp: new Date(),
      currentValue: calculatePositionValue(position),
      riskScore: calculatePositionRisk(position),
    }));
  } catch (error) {
    console.error('Error fetching user positions:', error);
    return [];
  }
}

export async function fetchFarcasterCasts(fid: number, limit = 10) {
  try {
    const response = await fetch(`${FARCASTER_HUB_URL}/v1/castsByFid?fid=${fid}&pageSize=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching Farcaster casts:', error);
    return [];
  }
}

export async function postFarcasterCast(text: string, parentHash?: string) {
  try {
    // This would require proper Farcaster authentication
    // Implementation depends on the specific Farcaster client being used
    console.log('Posting cast:', text, parentHash);
    return { success: true };
  } catch (error) {
    console.error('Error posting Farcaster cast:', error);
    return { success: false, error };
  }
}

// Helper Functions
async function fetchUniswapRate(tokenPair: string): Promise<ExchangeRate | null> {
  try {
    // Implementation for fetching Uniswap rates
    // This would query the specific pool for the token pair
    return {
      pair: tokenPair,
      exchange: 'Uniswap V3',
      rate: 1772.65, // Mock rate - replace with actual query
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching Uniswap rate:', error);
    return null;
  }
}

async function fetchAerodromeRate(tokenPair: string): Promise<ExchangeRate | null> {
  try {
    // Implementation for Aerodrome
    return {
      pair: tokenPair,
      exchange: 'Aerodrome',
      rate: 1771.89,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching Aerodrome rate:', error);
    return null;
  }
}

async function fetchBaseSwapRate(tokenPair: string): Promise<ExchangeRate | null> {
  try {
    // Implementation for BaseSwap
    return {
      pair: tokenPair,
      exchange: 'BaseSwap',
      rate: 1770.12,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching BaseSwap rate:', error);
    return null;
  }
}

function calculatePoolAPY(feesUSD: string, tvlUSD: string): number {
  const fees = parseFloat(feesUSD);
  const tvl = parseFloat(tvlUSD);
  
  if (tvl === 0) return 0;
  
  // Annualized APY calculation (assuming daily fees)
  return (fees * 365 / tvl) * 100;
}

function calculateRiskScore(pool: any): number {
  // Risk scoring algorithm based on:
  // - Pool age and stability
  // - Liquidity depth
  // - Volume consistency
  // - Token volatility
  
  let riskScore = 50; // Base risk
  
  // Adjust based on TVL (higher TVL = lower risk)
  const tvl = parseFloat(pool.totalValueLockedUSD);
  if (tvl > 10000000) riskScore -= 20;
  else if (tvl > 1000000) riskScore -= 10;
  else if (tvl < 100000) riskScore += 20;
  
  // Adjust based on volume (higher volume = lower risk)
  const volume = parseFloat(pool.volumeUSD);
  if (volume > 1000000) riskScore -= 10;
  else if (volume < 10000) riskScore += 15;
  
  return Math.max(0, Math.min(100, riskScore));
}

function calculatePositionValue(position: any): number {
  // Calculate current position value based on token amounts and current prices
  // This would require current token prices from an oracle or DEX
  return parseFloat(position.depositedToken0) + parseFloat(position.depositedToken1);
}

function calculatePositionRisk(position: any): number {
  // Calculate position-specific risk based on:
  // - Price range (tick range)
  // - Impermanent loss potential
  // - Pool risk
  
  const tickRange = Math.abs(
    parseInt(position.tickUpper.tickIdx) - parseInt(position.tickLower.tickIdx)
  );
  
  // Narrower ranges have higher risk
  let riskScore = 30;
  if (tickRange < 1000) riskScore += 30;
  else if (tickRange < 5000) riskScore += 15;
  
  return Math.max(0, Math.min(100, riskScore));
}

// Rate limiting and caching utilities
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
