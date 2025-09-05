// Core data model types
export interface User {
  userId: string;
  walletAddress: string;
  createdAt: Date;
}

export interface LPPosition {
  positionId: string;
  userId: string;
  protocol: string;
  poolAddress: string;
  token0: string;
  token1: string;
  amount0: number;
  amount1: number;
  depositTimestamp: Date;
  currentValue: number;
  riskScore: number;
}

export interface AssetWatchlist {
  watchlistId: string;
  userId: string;
  assetSymbol: string;
  currentPrice: number;
  priceChange24h: number;
}

export interface ExchangeRate {
  pair: string;
  exchange: string;
  rate: number;
  timestamp: Date;
}

// UI component types
export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  volume?: number;
}

export interface PoolData {
  protocol: string;
  pair: string;
  apy: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  riskScore: number;
}

export interface RateComparison {
  exchange: string;
  rate: number;
  spread: number;
  liquidity: number;
  fees: number;
}

export interface RiskAssessment {
  overall: number;
  impermanentLoss: number;
  smartContract: number;
  liquidity: number;
  protocol: number;
}
