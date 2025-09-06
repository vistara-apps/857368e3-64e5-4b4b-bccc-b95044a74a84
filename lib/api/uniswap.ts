import { config } from '@/lib/config';

// GraphQL queries for Uniswap V3 Subgraph
const POOLS_QUERY = `
  query GetPools($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
    pools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { liquidity_gt: "0" }
    ) {
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
      tvlUSD
      feesUSD
      txCount
      createdAtTimestamp
    }
  }
`;

const POOL_QUERY = `
  query GetPool($poolId: String!) {
    pool(id: $poolId) {
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
      tvlUSD
      feesUSD
      txCount
      createdAtTimestamp
    }
  }
`;

const POOL_HOURLY_DATA_QUERY = `
  query GetPoolHourlyData($poolId: String!, $first: Int!) {
    poolHourDatas(
      first: $first
      orderBy: periodStartUnix
      orderDirection: desc
      where: { pool: $poolId }
    ) {
      id
      periodStartUnix
      liquidity
      sqrtPrice
      token0Price
      token1Price
      volumeUSD
      tvlUSD
      feesUSD
      txCount
    }
  }
`;

const TOKEN_QUERY = `
  query GetToken($tokenId: String!) {
    token(id: $tokenId) {
      id
      symbol
      name
      decimals
      totalSupply
      volume
      volumeUSD
      txCount
      totalValueLocked
      totalValueLockedUSD
      derivedETH
    }
  }
`;

export interface UniswapToken {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  totalSupply?: string;
  volume?: string;
  volumeUSD?: string;
  txCount?: string;
  totalValueLocked?: string;
  totalValueLockedUSD?: string;
  derivedETH?: string;
}

export interface UniswapPool {
  id: string;
  token0: UniswapToken;
  token1: UniswapToken;
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  tick: string;
  token0Price: string;
  token1Price: string;
  volumeUSD: string;
  tvlUSD: string;
  feesUSD: string;
  txCount: string;
  createdAtTimestamp: string;
}

export interface PoolHourlyData {
  id: string;
  periodStartUnix: string;
  liquidity: string;
  sqrtPrice: string;
  token0Price: string;
  token1Price: string;
  volumeUSD: string;
  tvlUSD: string;
  feesUSD: string;
  txCount: string;
}

export interface PoolsResponse {
  pools: UniswapPool[];
}

export interface PoolResponse {
  pool: UniswapPool;
}

export interface PoolHourlyDataResponse {
  poolHourDatas: PoolHourlyData[];
}

export interface TokenResponse {
  token: UniswapToken;
}

class UniswapAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.uniswap.subgraphUrl;
  }

  private async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      console.error('Uniswap API query failed:', error);
      throw error;
    }
  }

  async getPools(
    first: number = 20,
    skip: number = 0,
    orderBy: string = 'tvlUSD',
    orderDirection: string = 'desc'
  ): Promise<UniswapPool[]> {
    const data = await this.query<PoolsResponse>(POOLS_QUERY, {
      first,
      skip,
      orderBy,
      orderDirection,
    });
    return data.pools;
  }

  async getPool(poolId: string): Promise<UniswapPool | null> {
    const data = await this.query<PoolResponse>(POOL_QUERY, { poolId });
    return data.pool;
  }

  async getPoolHourlyData(poolId: string, first: number = 24): Promise<PoolHourlyData[]> {
    const data = await this.query<PoolHourlyDataResponse>(POOL_HOURLY_DATA_QUERY, {
      poolId,
      first,
    });
    return data.poolHourDatas;
  }

  async getToken(tokenId: string): Promise<UniswapToken | null> {
    const data = await this.query<TokenResponse>(TOKEN_QUERY, { tokenId });
    return data.token;
  }

  async getTopPoolsByTVL(limit: number = 10): Promise<UniswapPool[]> {
    return this.getPools(limit, 0, 'tvlUSD', 'desc');
  }

  async getTopPoolsByVolume(limit: number = 10): Promise<UniswapPool[]> {
    return this.getPools(limit, 0, 'volumeUSD', 'desc');
  }

  async getPoolsForTokenPair(token0: string, token1: string): Promise<UniswapPool[]> {
    const pools = await this.getPools(100); // Get more pools to filter
    return pools.filter(pool => 
      (pool.token0.id.toLowerCase() === token0.toLowerCase() && 
       pool.token1.id.toLowerCase() === token1.toLowerCase()) ||
      (pool.token0.id.toLowerCase() === token1.toLowerCase() && 
       pool.token1.id.toLowerCase() === token0.toLowerCase())
    );
  }

  // Helper method to calculate APY from pool data
  calculatePoolAPY(pool: UniswapPool, hourlyData: PoolHourlyData[]): number {
    if (hourlyData.length < 24) return 0;

    const recent24h = hourlyData.slice(0, 24);
    const totalFees24h = recent24h.reduce((sum, data) => sum + parseFloat(data.feesUSD), 0);
    const avgTVL = recent24h.reduce((sum, data) => sum + parseFloat(data.tvlUSD), 0) / recent24h.length;

    if (avgTVL === 0) return 0;

    const dailyYield = totalFees24h / avgTVL;
    const annualYield = dailyYield * 365;

    return annualYield * 100; // Return as percentage
  }

  // Helper method to get exchange rate between two tokens
  getExchangeRate(pool: UniswapPool, fromToken: string, toToken: string): number {
    const fromTokenLower = fromToken.toLowerCase();
    const token0Lower = pool.token0.id.toLowerCase();
    const token1Lower = pool.token1.id.toLowerCase();

    if (fromTokenLower === token0Lower) {
      return parseFloat(pool.token0Price);
    } else if (fromTokenLower === token1Lower) {
      return parseFloat(pool.token1Price);
    }

    return 0;
  }
}

export const uniswapAPI = new UniswapAPI();
