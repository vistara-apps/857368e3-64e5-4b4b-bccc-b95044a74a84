import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

export function calculateAPY(principal: number, interest: number, periods: number): number {
  return ((1 + interest / periods) ** periods - 1) * 100;
}

export function calculateImpermanentLoss(
  priceRatio: number,
  initialRatio: number = 1
): number {
  const ratio = priceRatio / initialRatio;
  const il = (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
  return Math.abs(il) * 100;
}

export function getRiskColor(score: number): string {
  if (score >= 80) return 'text-error';
  if (score >= 60) return 'text-warning';
  if (score >= 40) return 'text-yellow-400';
  return 'text-success';
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return 'High Risk';
  if (score >= 60) return 'Medium-High Risk';
  if (score >= 40) return 'Medium Risk';
  if (score >= 20) return 'Low-Medium Risk';
  return 'Low Risk';
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function generateMockData() {
  return {
    liquiditySources: [
      { protocol: 'Uniswap V3', pair: 'WETH/USDC', apy: 6.60, tvl: 51750000, volume24h: 1659130, fees24h: 8740, riskScore: 25 },
      { protocol: 'Aerodrome', pair: 'WETH/USDC', apy: 8.45, tvl: 23400000, volume24h: 892000, fees24h: 4560, riskScore: 35 },
      { protocol: 'BaseSwap', pair: 'WETH/USDC', apy: 12.3, tvl: 8900000, volume24h: 445000, fees24h: 2890, riskScore: 55 },
      { protocol: 'SushiSwap', pair: 'WETH/USDC', apy: 5.2, tvl: 15600000, volume24h: 678000, fees24h: 3240, riskScore: 30 },
    ],
    rateComparisons: [
      { exchange: 'Uniswap V3', rate: 1772.65, spread: 0.05, liquidity: 45000000, fees: 0.3 },
      { exchange: 'Aerodrome', rate: 1771.89, spread: 0.08, liquidity: 23000000, fees: 0.25 },
      { exchange: 'BaseSwap', rate: 1770.12, spread: 0.12, liquidity: 8900000, fees: 0.4 },
      { exchange: 'SushiSwap', rate: 1773.21, spread: 0.06, liquidity: 15600000, fees: 0.3 },
    ],
    portfolioMetrics: {
      totalValue: 51750,
      totalEarnings: 1659.13,
      totalPositions: 8,
      avgAPY: 7.85,
      riskScore: 35,
    },
    chartData: Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      value: 50000 + Math.random() * 5000 + i * 100,
      volume: 800000 + Math.random() * 200000,
    })),
  };
}
