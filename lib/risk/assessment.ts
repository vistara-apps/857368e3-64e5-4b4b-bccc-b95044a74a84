import { config } from '@/lib/config';
import { PoolData } from '@/hooks/usePoolData';

export interface RiskFactors {
  smartContract: number;
  liquidity: number;
  impermanentLoss: number;
  protocol: number;
}

export interface RiskAssessment {
  overall: number;
  impermanentLoss: number;
  smartContract: number;
  liquidity: number;
  protocol: number;
  factors: RiskFactors;
  recommendations: string[];
}

export interface ProtocolRiskData {
  name: string;
  auditScore: number; // 0-100, higher is better
  tvlHistory: number[]; // Historical TVL data
  exploitHistory: number; // Number of past exploits
  timeInMarket: number; // Days since launch
}

// Protocol risk data (in a real implementation, this would come from a database)
const protocolRiskDatabase: Record<string, ProtocolRiskData> = {
  'Uniswap V3': {
    name: 'Uniswap V3',
    auditScore: 95,
    tvlHistory: [1000000000, 1100000000, 1200000000], // Stable growth
    exploitHistory: 0,
    timeInMarket: 1200, // ~3+ years
  },
  'Aerodrome': {
    name: 'Aerodrome',
    auditScore: 85,
    tvlHistory: [100000000, 150000000, 200000000], // Growing
    exploitHistory: 0,
    timeInMarket: 365, // ~1 year
  },
  'BaseSwap': {
    name: 'BaseSwap',
    auditScore: 70,
    tvlHistory: [50000000, 45000000, 40000000], // Declining
    exploitHistory: 1,
    timeInMarket: 180, // ~6 months
  },
  'SushiSwap': {
    name: 'SushiSwap',
    auditScore: 80,
    tvlHistory: [500000000, 480000000, 520000000], // Stable
    exploitHistory: 2,
    timeInMarket: 1400, // ~4 years
  },
};

export class RiskAssessmentEngine {
  private weights = config.risk.protocolRiskWeights;

  /**
   * Calculate smart contract risk based on protocol data
   */
  calculateSmartContractRisk(protocol: string): number {
    const protocolData = protocolRiskDatabase[protocol];
    if (!protocolData) return 70; // Default medium-high risk for unknown protocols

    let risk = 0;

    // Audit score factor (0-40 points)
    const auditRisk = Math.max(0, 100 - protocolData.auditScore) * 0.4;
    risk += auditRisk;

    // Exploit history factor (0-30 points)
    const exploitRisk = Math.min(30, protocolData.exploitHistory * 15);
    risk += exploitRisk;

    // Time in market factor (0-30 points)
    const timeRisk = Math.max(0, 30 - (protocolData.timeInMarket / 365) * 10);
    risk += timeRisk;

    return Math.min(100, risk);
  }

  /**
   * Calculate liquidity risk based on pool TVL and volume
   */
  calculateLiquidityRisk(pool: PoolData): number {
    let risk = 0;

    // TVL risk (0-50 points)
    if (pool.tvl < config.risk.liquidityThreshold) {
      const tvlRatio = pool.tvl / config.risk.liquidityThreshold;
      risk += (1 - tvlRatio) * 50;
    }

    // Volume to TVL ratio risk (0-30 points)
    const volumeToTvlRatio = pool.volume24h / pool.tvl;
    if (volumeToTvlRatio < 0.1) { // Less than 10% daily turnover
      risk += (0.1 - volumeToTvlRatio) * 300; // Scale up the penalty
    }

    // Concentration risk (0-20 points)
    // This would require more data about pool composition
    risk += 10; // Default moderate concentration risk

    return Math.min(100, risk);
  }

  /**
   * Calculate impermanent loss risk based on token pair volatility
   */
  calculateImpermanentLossRisk(pool: PoolData): number {
    // This is a simplified calculation
    // In reality, you'd need historical price data and correlation analysis
    
    let risk = 0;

    // Token pair type risk
    const pair = pool.pair.toLowerCase();
    
    if (pair.includes('eth') && pair.includes('usdc')) {
      // ETH/Stablecoin pairs have moderate IL risk
      risk = 35;
    } else if (pair.includes('usdc') && pair.includes('usdt')) {
      // Stablecoin pairs have very low IL risk
      risk = 5;
    } else if (pair.includes('btc') && pair.includes('eth')) {
      // Major crypto pairs have high IL risk
      risk = 60;
    } else {
      // Unknown pairs get high risk
      risk = 70;
    }

    // Adjust based on APY (higher APY might indicate higher IL risk)
    if (pool.apy > 20) {
      risk += 15; // High APY often means high IL risk
    } else if (pool.apy > 10) {
      risk += 5;
    }

    return Math.min(100, risk);
  }

  /**
   * Calculate protocol-specific risk
   */
  calculateProtocolRisk(protocol: string): number {
    const protocolData = protocolRiskDatabase[protocol];
    if (!protocolData) return 60; // Default risk for unknown protocols

    let risk = 0;

    // TVL trend risk (0-40 points)
    const tvlHistory = protocolData.tvlHistory;
    if (tvlHistory.length >= 2) {
      const recentTrend = tvlHistory[tvlHistory.length - 1] / tvlHistory[tvlHistory.length - 2];
      if (recentTrend < 0.9) { // 10% decline
        risk += 30;
      } else if (recentTrend < 0.95) { // 5% decline
        risk += 15;
      }
    }

    // Governance risk (0-30 points)
    // This would require governance token distribution data
    risk += 15; // Default moderate governance risk

    // Regulatory risk (0-30 points)
    // This would require regulatory analysis
    risk += 10; // Default low regulatory risk

    return Math.min(100, risk);
  }

  /**
   * Generate risk recommendations based on assessment
   */
  generateRecommendations(assessment: RiskAssessment, pool: PoolData): string[] {
    const recommendations: string[] = [];

    if (assessment.overall > 70) {
      recommendations.push('⚠️ High risk position - consider reducing exposure');
    }

    if (assessment.liquidity > 60) {
      recommendations.push('💧 Low liquidity detected - monitor for slippage risks');
    }

    if (assessment.impermanentLoss > 50) {
      recommendations.push('📉 High impermanent loss risk - consider stable pairs');
    }

    if (assessment.smartContract > 60) {
      recommendations.push('🔒 Smart contract risks detected - verify protocol audits');
    }

    if (assessment.protocol > 50) {
      recommendations.push('🏛️ Protocol risks present - diversify across multiple protocols');
    }

    if (pool.apy > 15) {
      recommendations.push('🎯 High APY may indicate elevated risks - proceed with caution');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Risk levels appear manageable for this position');
    }

    return recommendations;
  }

  /**
   * Perform comprehensive risk assessment for a pool
   */
  assessPool(pool: PoolData): RiskAssessment {
    const factors: RiskFactors = {
      smartContract: this.calculateSmartContractRisk(pool.protocol),
      liquidity: this.calculateLiquidityRisk(pool),
      impermanentLoss: this.calculateImpermanentLossRisk(pool),
      protocol: this.calculateProtocolRisk(pool.protocol),
    };

    // Calculate weighted overall risk
    const overall = 
      factors.smartContract * this.weights.smartContract +
      factors.liquidity * this.weights.liquidity +
      factors.impermanentLoss * this.weights.impermanentLoss +
      factors.protocol * this.weights.protocol;

    const assessment: RiskAssessment = {
      overall: Math.round(overall),
      impermanentLoss: Math.round(factors.impermanentLoss),
      smartContract: Math.round(factors.smartContract),
      liquidity: Math.round(factors.liquidity),
      protocol: Math.round(factors.protocol),
      factors,
      recommendations: [],
    };

    assessment.recommendations = this.generateRecommendations(assessment, pool);

    return assessment;
  }

  /**
   * Assess portfolio risk across multiple positions
   */
  assessPortfolio(pools: PoolData[]): RiskAssessment {
    if (pools.length === 0) {
      return {
        overall: 0,
        impermanentLoss: 0,
        smartContract: 0,
        liquidity: 0,
        protocol: 0,
        factors: { smartContract: 0, liquidity: 0, impermanentLoss: 0, protocol: 0 },
        recommendations: ['No positions to assess'],
      };
    }

    // Calculate TVL-weighted average risks
    const totalTvl = pools.reduce((sum, pool) => sum + pool.tvl, 0);
    
    const weightedFactors = pools.reduce((acc, pool) => {
      const weight = pool.tvl / totalTvl;
      const poolAssessment = this.assessPool(pool);
      
      acc.smartContract += poolAssessment.smartContract * weight;
      acc.liquidity += poolAssessment.liquidity * weight;
      acc.impermanentLoss += poolAssessment.impermanentLoss * weight;
      acc.protocol += poolAssessment.protocol * weight;
      
      return acc;
    }, { smartContract: 0, liquidity: 0, impermanentLoss: 0, protocol: 0 });

    const overall = 
      weightedFactors.smartContract * this.weights.smartContract +
      weightedFactors.liquidity * this.weights.liquidity +
      weightedFactors.impermanentLoss * this.weights.impermanentLoss +
      weightedFactors.protocol * this.weights.protocol;

    const assessment: RiskAssessment = {
      overall: Math.round(overall),
      impermanentLoss: Math.round(weightedFactors.impermanentLoss),
      smartContract: Math.round(weightedFactors.smartContract),
      liquidity: Math.round(weightedFactors.liquidity),
      protocol: Math.round(weightedFactors.protocol),
      factors: weightedFactors,
      recommendations: [],
    };

    // Generate portfolio-level recommendations
    const portfolioRecommendations: string[] = [];
    
    if (pools.length < 3) {
      portfolioRecommendations.push('🔄 Consider diversifying across more protocols');
    }

    const protocolCount = new Set(pools.map(p => p.protocol)).size;
    if (protocolCount === 1) {
      portfolioRecommendations.push('⚖️ All positions on single protocol - consider diversification');
    }

    const highRiskPools = pools.filter(p => this.assessPool(p).overall > 70);
    if (highRiskPools.length > 0) {
      portfolioRecommendations.push(`⚠️ ${highRiskPools.length} high-risk position(s) detected`);
    }

    assessment.recommendations = portfolioRecommendations;

    return assessment;
  }
}

export const riskAssessmentEngine = new RiskAssessmentEngine();
