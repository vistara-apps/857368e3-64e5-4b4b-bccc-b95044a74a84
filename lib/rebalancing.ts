import { LPPosition, PoolData } from './types';
import { calculateImpermanentLoss, calculateAPY } from './utils';
import { fetchUniswapPools, fetchUserPositions } from './api';

export interface RebalancingStrategy {
  id: string;
  name: string;
  description: string;
  targetAPY: number;
  maxImpermanentLoss: number;
  riskTolerance: 'low' | 'medium' | 'high';
  rebalanceThreshold: number; // Percentage change to trigger rebalance
  enabled: boolean;
}

export interface RebalancingRecommendation {
  positionId: string;
  action: 'rebalance' | 'exit' | 'adjust' | 'hold';
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  expectedGain?: number;
  riskReduction?: number;
  newPool?: PoolData;
  estimatedCost?: number;
}

export interface RebalancingAnalysis {
  totalPositions: number;
  positionsAtRisk: number;
  underperformingPositions: number;
  totalPotentialGain: number;
  recommendations: RebalancingRecommendation[];
  lastAnalysis: Date;
}

// Default rebalancing strategies
export const DEFAULT_STRATEGIES: RebalancingStrategy[] = [
  {
    id: 'conservative',
    name: 'Conservative Growth',
    description: 'Focus on stable yields with minimal impermanent loss risk',
    targetAPY: 5,
    maxImpermanentLoss: 2,
    riskTolerance: 'low',
    rebalanceThreshold: 10,
    enabled: false,
  },
  {
    id: 'balanced',
    name: 'Balanced Optimization',
    description: 'Balance between yield and risk for steady growth',
    targetAPY: 8,
    maxImpermanentLoss: 5,
    riskTolerance: 'medium',
    rebalanceThreshold: 15,
    enabled: false,
  },
  {
    id: 'aggressive',
    name: 'Aggressive Yield',
    description: 'Maximize yields with higher risk tolerance',
    targetAPY: 15,
    maxImpermanentLoss: 10,
    riskTolerance: 'high',
    rebalanceThreshold: 20,
    enabled: false,
  },
];

export class RebalancingEngine {
  private strategy: RebalancingStrategy;
  private positions: LPPosition[] = [];
  private availablePools: PoolData[] = [];

  constructor(strategy: RebalancingStrategy) {
    this.strategy = strategy;
  }

  async analyzePositions(walletAddress: string): Promise<RebalancingAnalysis> {
    try {
      // Fetch current positions and available pools
      this.positions = await fetchUserPositions(walletAddress);
      this.availablePools = await fetchUniswapPools(50);

      const recommendations: RebalancingRecommendation[] = [];
      let positionsAtRisk = 0;
      let underperformingPositions = 0;
      let totalPotentialGain = 0;

      // Analyze each position
      for (const position of this.positions) {
        const analysis = await this.analyzePosition(position);
        
        if (analysis) {
          recommendations.push(analysis);
          
          if (analysis.urgency === 'high') {
            positionsAtRisk++;
          }
          
          if (analysis.action === 'rebalance' || analysis.action === 'exit') {
            underperformingPositions++;
          }
          
          if (analysis.expectedGain) {
            totalPotentialGain += analysis.expectedGain;
          }
        }
      }

      return {
        totalPositions: this.positions.length,
        positionsAtRisk,
        underperformingPositions,
        totalPotentialGain,
        recommendations,
        lastAnalysis: new Date(),
      };
    } catch (error) {
      console.error('Error analyzing positions:', error);
      throw error;
    }
  }

  private async analyzePosition(position: LPPosition): Promise<RebalancingRecommendation | null> {
    try {
      // Find current pool data
      const currentPool = this.availablePools.find(pool => 
        pool.pair === `${position.token0}/${position.token1}` ||
        pool.pair === `${position.token1}/${position.token0}`
      );

      if (!currentPool) {
        return null;
      }

      // Calculate current performance metrics
      const currentAPY = currentPool.apy;
      const estimatedIL = this.estimateImpermanentLoss(position);
      const riskScore = currentPool.riskScore;

      // Check if position meets strategy criteria
      const recommendation = this.evaluatePosition(
        position,
        currentPool,
        currentAPY,
        estimatedIL,
        riskScore
      );

      return recommendation;
    } catch (error) {
      console.error('Error analyzing position:', error);
      return null;
    }
  }

  private evaluatePosition(
    position: LPPosition,
    currentPool: PoolData,
    currentAPY: number,
    impermanentLoss: number,
    riskScore: number
  ): RebalancingRecommendation {
    const { targetAPY, maxImpermanentLoss, riskTolerance, rebalanceThreshold } = this.strategy;

    // Check for high-risk situations (immediate action needed)
    if (impermanentLoss > maxImpermanentLoss * 2) {
      return {
        positionId: position.positionId,
        action: 'exit',
        reason: `Impermanent loss (${impermanentLoss.toFixed(2)}%) exceeds maximum tolerance`,
        urgency: 'high',
        riskReduction: impermanentLoss,
        estimatedCost: this.estimateTransactionCost(position),
      };
    }

    // Check for underperformance
    if (currentAPY < targetAPY * 0.7) {
      const betterPool = this.findBetterPool(position, currentPool);
      
      if (betterPool) {
        const potentialGain = this.calculatePotentialGain(position, currentPool, betterPool);
        
        return {
          positionId: position.positionId,
          action: 'rebalance',
          reason: `Current APY (${currentAPY.toFixed(2)}%) below target. Better opportunity available`,
          urgency: potentialGain > rebalanceThreshold ? 'high' : 'medium',
          expectedGain: potentialGain,
          newPool: betterPool,
          estimatedCost: this.estimateTransactionCost(position),
        };
      }
    }

    // Check risk tolerance
    if (this.isRiskTooHigh(riskScore, riskTolerance)) {
      const saferPool = this.findSaferPool(position, currentPool);
      
      if (saferPool) {
        return {
          positionId: position.positionId,
          action: 'adjust',
          reason: `Risk score (${riskScore}) exceeds tolerance for ${riskTolerance} strategy`,
          urgency: 'medium',
          riskReduction: riskScore - saferPool.riskScore,
          newPool: saferPool,
          estimatedCost: this.estimateTransactionCost(position),
        };
      }
    }

    // Check for moderate impermanent loss
    if (impermanentLoss > maxImpermanentLoss) {
      return {
        positionId: position.positionId,
        action: 'adjust',
        reason: `Impermanent loss (${impermanentLoss.toFixed(2)}%) approaching maximum tolerance`,
        urgency: 'medium',
        riskReduction: impermanentLoss - maxImpermanentLoss,
        estimatedCost: this.estimateTransactionCost(position),
      };
    }

    // Position is performing well
    return {
      positionId: position.positionId,
      action: 'hold',
      reason: `Position performing within strategy parameters (APY: ${currentAPY.toFixed(2)}%)`,
      urgency: 'low',
    };
  }

  private findBetterPool(position: LPPosition, currentPool: PoolData): PoolData | null {
    const { targetAPY, riskTolerance } = this.strategy;
    
    // Find pools with same or similar token pairs
    const candidatePools = this.availablePools.filter(pool => {
      // Same token pair
      const sameTokens = (
        (pool.pair.includes(position.token0) && pool.pair.includes(position.token1)) ||
        (pool.pair.includes(position.token1) && pool.pair.includes(position.token0))
      );
      
      // Better APY
      const betterAPY = pool.apy > currentPool.apy * 1.1; // At least 10% better
      
      // Acceptable risk
      const acceptableRisk = this.isRiskAcceptable(pool.riskScore, riskTolerance);
      
      return sameTokens && betterAPY && acceptableRisk;
    });

    // Return the best option
    return candidatePools.reduce((best, current) => {
      if (!best) return current;
      
      // Prefer higher APY with acceptable risk
      const currentScore = current.apy - (current.riskScore * 0.1);
      const bestScore = best.apy - (best.riskScore * 0.1);
      
      return currentScore > bestScore ? current : best;
    }, null as PoolData | null);
  }

  private findSaferPool(position: LPPosition, currentPool: PoolData): PoolData | null {
    const candidatePools = this.availablePools.filter(pool => {
      // Same token pair
      const sameTokens = (
        (pool.pair.includes(position.token0) && pool.pair.includes(position.token1)) ||
        (pool.pair.includes(position.token1) && pool.pair.includes(position.token0))
      );
      
      // Lower risk
      const lowerRisk = pool.riskScore < currentPool.riskScore * 0.8;
      
      // Reasonable APY (not too much sacrifice)
      const reasonableAPY = pool.apy > currentPool.apy * 0.7;
      
      return sameTokens && lowerRisk && reasonableAPY;
    });

    return candidatePools.reduce((best, current) => {
      if (!best) return current;
      
      // Prefer lower risk with reasonable APY
      const currentScore = current.apy - current.riskScore;
      const bestScore = best.apy - best.riskScore;
      
      return currentScore > bestScore ? current : best;
    }, null as PoolData | null);
  }

  private calculatePotentialGain(
    position: LPPosition,
    currentPool: PoolData,
    newPool: PoolData
  ): number {
    const currentValue = position.currentValue;
    const apyDifference = newPool.apy - currentPool.apy;
    
    // Estimate annual gain difference
    return (currentValue * apyDifference) / 100;
  }

  private estimateImpermanentLoss(position: LPPosition): number {
    // This would require current token prices and initial deposit ratio
    // For now, return a mock calculation based on position age and volatility
    const daysSinceDeposit = Math.floor(
      (Date.now() - position.depositTimestamp.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Estimate based on time and typical volatility
    return Math.min(daysSinceDeposit * 0.1, 15); // Max 15% IL
  }

  private estimateTransactionCost(position: LPPosition): number {
    // Estimate gas costs for exit + enter operations
    // This would be calculated based on current gas prices and complexity
    return 50; // Mock $50 transaction cost
  }

  private isRiskTooHigh(riskScore: number, tolerance: string): boolean {
    switch (tolerance) {
      case 'low':
        return riskScore > 40;
      case 'medium':
        return riskScore > 60;
      case 'high':
        return riskScore > 80;
      default:
        return false;
    }
  }

  private isRiskAcceptable(riskScore: number, tolerance: string): boolean {
    return !this.isRiskTooHigh(riskScore, tolerance);
  }

  // Execute rebalancing recommendation
  async executeRebalancing(recommendation: RebalancingRecommendation): Promise<boolean> {
    try {
      console.log('Executing rebalancing:', recommendation);
      
      // This would integrate with actual DeFi protocols
      // For now, just log the action
      
      switch (recommendation.action) {
        case 'exit':
          return await this.exitPosition(recommendation.positionId);
        case 'rebalance':
          return await this.rebalancePosition(recommendation.positionId, recommendation.newPool!);
        case 'adjust':
          return await this.adjustPosition(recommendation.positionId, recommendation.newPool!);
        default:
          return true;
      }
    } catch (error) {
      console.error('Error executing rebalancing:', error);
      return false;
    }
  }

  private async exitPosition(positionId: string): Promise<boolean> {
    // Implementation would call the appropriate DeFi protocol
    console.log('Exiting position:', positionId);
    return true;
  }

  private async rebalancePosition(positionId: string, newPool: PoolData): Promise<boolean> {
    // Implementation would exit current position and enter new one
    console.log('Rebalancing position:', positionId, 'to', newPool.protocol);
    return true;
  }

  private async adjustPosition(positionId: string, newPool: PoolData): Promise<boolean> {
    // Implementation would modify current position parameters
    console.log('Adjusting position:', positionId, 'with', newPool.protocol);
    return true;
  }
}

// Utility functions for strategy management
export function createCustomStrategy(
  name: string,
  targetAPY: number,
  maxImpermanentLoss: number,
  riskTolerance: 'low' | 'medium' | 'high'
): RebalancingStrategy {
  return {
    id: `custom-${Date.now()}`,
    name,
    description: `Custom strategy targeting ${targetAPY}% APY with ${maxImpermanentLoss}% max IL`,
    targetAPY,
    maxImpermanentLoss,
    riskTolerance,
    rebalanceThreshold: riskTolerance === 'low' ? 10 : riskTolerance === 'medium' ? 15 : 20,
    enabled: false,
  };
}

export function validateStrategy(strategy: RebalancingStrategy): string[] {
  const errors: string[] = [];
  
  if (strategy.targetAPY < 0 || strategy.targetAPY > 100) {
    errors.push('Target APY must be between 0% and 100%');
  }
  
  if (strategy.maxImpermanentLoss < 0 || strategy.maxImpermanentLoss > 50) {
    errors.push('Max impermanent loss must be between 0% and 50%');
  }
  
  if (strategy.rebalanceThreshold < 5 || strategy.rebalanceThreshold > 50) {
    errors.push('Rebalance threshold must be between 5% and 50%');
  }
  
  return errors;
}
