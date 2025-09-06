import { LPPosition, PoolData, RiskAssessment } from './types';
import { calculateImpermanentLoss } from './utils';

export interface DetailedRiskAssessment extends RiskAssessment {
  factors: RiskFactor[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeHorizon: '1d' | '7d' | '30d' | '90d';
  confidence: number; // 0-100
}

export interface RiskFactor {
  category: 'impermanent_loss' | 'smart_contract' | 'liquidity' | 'protocol' | 'market' | 'concentration';
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  description: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface PortfolioRiskMetrics {
  totalRisk: number;
  diversificationScore: number;
  concentrationRisk: number;
  liquidityRisk: number;
  protocolRisk: number;
  marketRisk: number;
  riskAdjustedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk: number; // 95% VaR
}

export class RiskAssessmentEngine {
  private readonly RISK_WEIGHTS = {
    impermanent_loss: 0.25,
    smart_contract: 0.20,
    liquidity: 0.20,
    protocol: 0.15,
    market: 0.15,
    concentration: 0.05,
  };

  private readonly PROTOCOL_RISK_SCORES = {
    'Uniswap V3': 15,
    'Aerodrome': 25,
    'BaseSwap': 45,
    'SushiSwap': 20,
    'Curve': 18,
    'Balancer': 22,
  };

  async assessPosition(position: LPPosition, poolData: PoolData): Promise<DetailedRiskAssessment> {
    const factors = await this.calculateRiskFactors(position, poolData);
    const overall = this.calculateOverallRisk(factors);
    const severity = this.determineSeverity(overall);
    const recommendations = this.generateRecommendations(factors, severity);

    return {
      overall,
      impermanentLoss: factors.find(f => f.category === 'impermanent_loss')?.score || 0,
      smartContract: factors.find(f => f.category === 'smart_contract')?.score || 0,
      liquidity: factors.find(f => f.category === 'liquidity')?.score || 0,
      protocol: factors.find(f => f.category === 'protocol')?.score || 0,
      factors,
      recommendations,
      severity,
      timeHorizon: '30d',
      confidence: this.calculateConfidence(factors),
    };
  }

  async assessPortfolio(positions: LPPosition[], poolsData: PoolData[]): Promise<PortfolioRiskMetrics> {
    const positionAssessments = await Promise.all(
      positions.map(async (position) => {
        const poolData = poolsData.find(p => 
          p.pair.includes(position.token0) && p.pair.includes(position.token1)
        );
        return poolData ? await this.assessPosition(position, poolData) : null;
      })
    );

    const validAssessments = positionAssessments.filter(Boolean) as DetailedRiskAssessment[];
    
    return {
      totalRisk: this.calculatePortfolioRisk(validAssessments, positions),
      diversificationScore: this.calculateDiversificationScore(positions),
      concentrationRisk: this.calculateConcentrationRisk(positions),
      liquidityRisk: this.calculatePortfolioLiquidityRisk(validAssessments),
      protocolRisk: this.calculatePortfolioProtocolRisk(positions),
      marketRisk: this.calculateMarketRisk(positions, poolsData),
      riskAdjustedReturn: this.calculateRiskAdjustedReturn(positions, poolsData),
      sharpeRatio: this.calculateSharpeRatio(positions, poolsData),
      maxDrawdown: this.calculateMaxDrawdown(positions),
      valueAtRisk: this.calculateValueAtRisk(positions, poolsData),
    };
  }

  private async calculateRiskFactors(position: LPPosition, poolData: PoolData): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Impermanent Loss Risk
    const ilRisk = this.assessImpermanentLossRisk(position, poolData);
    factors.push(ilRisk);

    // Smart Contract Risk
    const scRisk = this.assessSmartContractRisk(position, poolData);
    factors.push(scRisk);

    // Liquidity Risk
    const liquidityRisk = this.assessLiquidityRisk(position, poolData);
    factors.push(liquidityRisk);

    // Protocol Risk
    const protocolRisk = this.assessProtocolRisk(position, poolData);
    factors.push(protocolRisk);

    // Market Risk
    const marketRisk = this.assessMarketRisk(position, poolData);
    factors.push(marketRisk);

    return factors;
  }

  private assessImpermanentLossRisk(position: LPPosition, poolData: PoolData): RiskFactor {
    // Calculate potential IL based on historical volatility and correlation
    const volatilityScore = this.estimateTokenVolatility(position.token0, position.token1);
    const correlationScore = this.estimateTokenCorrelation(position.token0, position.token1);
    const timeScore = this.calculateTimeRisk(position.depositTimestamp);
    
    const ilScore = Math.min(100, (volatilityScore * 0.5 + correlationScore * 0.3 + timeScore * 0.2));
    
    return {
      category: 'impermanent_loss',
      name: 'Impermanent Loss Risk',
      score: ilScore,
      weight: this.RISK_WEIGHTS.impermanent_loss,
      description: `Risk of value loss due to price divergence between ${position.token0} and ${position.token1}`,
      impact: ilScore > 60 ? 'high' : ilScore > 30 ? 'medium' : 'low',
      likelihood: volatilityScore > 70 ? 'high' : volatilityScore > 40 ? 'medium' : 'low',
      mitigation: 'Consider correlated pairs or shorter time horizons to reduce IL risk',
    };
  }

  private assessSmartContractRisk(position: LPPosition, poolData: PoolData): RiskFactor {
    // Assess smart contract security based on protocol maturity, audits, TVL
    const protocolMaturity = this.getProtocolMaturityScore(poolData.protocol);
    const auditScore = this.getAuditScore(poolData.protocol);
    const tvlScore = Math.min(100, (poolData.tvl / 100000000) * 100); // Normalize by $100M
    
    const scScore = 100 - Math.min(100, (protocolMaturity * 0.4 + auditScore * 0.4 + tvlScore * 0.2));
    
    return {
      category: 'smart_contract',
      name: 'Smart Contract Risk',
      score: scScore,
      weight: this.RISK_WEIGHTS.smart_contract,
      description: `Risk of smart contract vulnerabilities in ${poolData.protocol}`,
      impact: scScore > 70 ? 'high' : scScore > 40 ? 'medium' : 'low',
      likelihood: scScore > 60 ? 'medium' : 'low',
      mitigation: 'Diversify across multiple protocols and prefer audited, battle-tested protocols',
    };
  }

  private assessLiquidityRisk(position: LPPosition, poolData: PoolData): RiskFactor {
    // Assess liquidity risk based on pool depth, volume, and slippage
    const depthScore = Math.min(100, (poolData.tvl / 10000000) * 100); // Normalize by $10M
    const volumeScore = Math.min(100, (poolData.volume24h / poolData.tvl) * 100);
    const utilizationScore = Math.min(100, (poolData.fees24h / poolData.tvl) * 365 * 100);
    
    const liquidityScore = 100 - Math.min(100, (depthScore * 0.5 + volumeScore * 0.3 + utilizationScore * 0.2));
    
    return {
      category: 'liquidity',
      name: 'Liquidity Risk',
      score: liquidityScore,
      weight: this.RISK_WEIGHTS.liquidity,
      description: 'Risk of inability to exit position at fair price due to low liquidity',
      impact: liquidityScore > 60 ? 'high' : liquidityScore > 30 ? 'medium' : 'low',
      likelihood: poolData.tvl < 1000000 ? 'high' : poolData.tvl < 10000000 ? 'medium' : 'low',
      mitigation: 'Prefer high-TVL pools with consistent trading volume',
    };
  }

  private assessProtocolRisk(position: LPPosition, poolData: PoolData): RiskFactor {
    const protocolScore = this.PROTOCOL_RISK_SCORES[poolData.protocol as keyof typeof this.PROTOCOL_RISK_SCORES] || 50;
    
    return {
      category: 'protocol',
      name: 'Protocol Risk',
      score: protocolScore,
      weight: this.RISK_WEIGHTS.protocol,
      description: `Risk associated with ${poolData.protocol} protocol governance and operations`,
      impact: protocolScore > 60 ? 'high' : protocolScore > 30 ? 'medium' : 'low',
      likelihood: 'medium',
      mitigation: 'Monitor protocol governance and consider diversifying across protocols',
    };
  }

  private assessMarketRisk(position: LPPosition, poolData: PoolData): RiskFactor {
    // Assess broader market risk factors
    const marketVolatility = this.estimateMarketVolatility();
    const correlationRisk = this.estimateMarketCorrelation(position.token0, position.token1);
    const macroRisk = this.estimateMacroRisk();
    
    const marketScore = Math.min(100, (marketVolatility * 0.4 + correlationRisk * 0.3 + macroRisk * 0.3));
    
    return {
      category: 'market',
      name: 'Market Risk',
      score: marketScore,
      weight: this.RISK_WEIGHTS.market,
      description: 'Risk from broader market conditions and macroeconomic factors',
      impact: marketScore > 70 ? 'high' : marketScore > 40 ? 'medium' : 'low',
      likelihood: 'medium',
      mitigation: 'Consider market timing and maintain appropriate position sizing',
    };
  }

  private calculateOverallRisk(factors: RiskFactor[]): number {
    return factors.reduce((total, factor) => {
      return total + (factor.score * factor.weight);
    }, 0);
  }

  private determineSeverity(overallRisk: number): 'low' | 'medium' | 'high' | 'critical' {
    if (overallRisk >= 80) return 'critical';
    if (overallRisk >= 60) return 'high';
    if (overallRisk >= 40) return 'medium';
    return 'low';
  }

  private generateRecommendations(factors: RiskFactor[], severity: string): string[] {
    const recommendations: string[] = [];
    
    // High-risk factors get priority recommendations
    const highRiskFactors = factors.filter(f => f.score > 60);
    
    if (severity === 'critical') {
      recommendations.push('🚨 Consider immediate position review and potential exit');
    }
    
    if (severity === 'high') {
      recommendations.push('⚠️ Monitor position closely and consider risk reduction');
    }
    
    highRiskFactors.forEach(factor => {
      if (factor.mitigation) {
        recommendations.push(`• ${factor.name}: ${factor.mitigation}`);
      }
    });
    
    // General recommendations based on risk profile
    if (factors.some(f => f.category === 'impermanent_loss' && f.score > 50)) {
      recommendations.push('• Consider more correlated token pairs to reduce IL');
    }
    
    if (factors.some(f => f.category === 'liquidity' && f.score > 50)) {
      recommendations.push('• Move to higher liquidity pools for better exit conditions');
    }
    
    if (factors.some(f => f.category === 'protocol' && f.score > 50)) {
      recommendations.push('• Diversify across multiple protocols to reduce concentration');
    }
    
    return recommendations;
  }

  private calculateConfidence(factors: RiskFactor[]): number {
    // Confidence based on data availability and model reliability
    const dataQuality = factors.length >= 4 ? 80 : factors.length * 20;
    const modelReliability = 85; // Base model confidence
    
    return Math.min(100, (dataQuality * 0.6 + modelReliability * 0.4));
  }

  // Portfolio-level risk calculations
  private calculatePortfolioRisk(assessments: DetailedRiskAssessment[], positions: LPPosition[]): number {
    if (assessments.length === 0) return 0;
    
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const weightedRisk = assessments.reduce((sum, assessment, index) => {
      const weight = positions[index].currentValue / totalValue;
      return sum + (assessment.overall * weight);
    }, 0);
    
    // Apply diversification benefit
    const diversificationBenefit = this.calculateDiversificationBenefit(positions);
    return Math.max(0, weightedRisk * (1 - diversificationBenefit));
  }

  private calculateDiversificationScore(positions: LPPosition[]): number {
    if (positions.length <= 1) return 0;
    
    // Calculate based on protocol diversity, token diversity, and position size distribution
    const protocols = new Set(positions.map(p => p.protocol));
    const tokens = new Set(positions.flatMap(p => [p.token0, p.token1]));
    
    const protocolDiversity = Math.min(100, (protocols.size / 5) * 100); // Max 5 protocols
    const tokenDiversity = Math.min(100, (tokens.size / 10) * 100); // Max 10 unique tokens
    const sizeDiversity = this.calculateSizeDiversity(positions);
    
    return (protocolDiversity * 0.4 + tokenDiversity * 0.4 + sizeDiversity * 0.2);
  }

  private calculateConcentrationRisk(positions: LPPosition[]): number {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const maxPosition = Math.max(...positions.map(p => p.currentValue));
    
    return (maxPosition / totalValue) * 100;
  }

  private calculatePortfolioLiquidityRisk(assessments: DetailedRiskAssessment[]): number {
    if (assessments.length === 0) return 0;
    
    return assessments.reduce((sum, assessment) => {
      return sum + (assessment.liquidity || 0);
    }, 0) / assessments.length;
  }

  private calculatePortfolioProtocolRisk(positions: LPPosition[]): number {
    const protocolCounts = positions.reduce((counts, position) => {
      counts[position.protocol] = (counts[position.protocol] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const totalPositions = positions.length;
    const maxProtocolConcentration = Math.max(...Object.values(protocolCounts));
    
    return (maxProtocolConcentration / totalPositions) * 100;
  }

  private calculateMarketRisk(positions: LPPosition[], poolsData: PoolData[]): number {
    // Simplified market risk based on token correlations and market exposure
    return 45; // Mock value - would calculate based on actual market data
  }

  private calculateRiskAdjustedReturn(positions: LPPosition[], poolsData: PoolData[]): number {
    // Calculate return adjusted for risk (Sharpe-like ratio)
    const totalReturn = this.calculatePortfolioReturn(positions, poolsData);
    const totalRisk = this.calculatePortfolioVolatility(positions, poolsData);
    
    return totalRisk > 0 ? totalReturn / totalRisk : 0;
  }

  private calculateSharpeRatio(positions: LPPosition[], poolsData: PoolData[]): number {
    const portfolioReturn = this.calculatePortfolioReturn(positions, poolsData);
    const riskFreeRate = 0.05; // 5% risk-free rate
    const portfolioVolatility = this.calculatePortfolioVolatility(positions, poolsData);
    
    return portfolioVolatility > 0 ? (portfolioReturn - riskFreeRate) / portfolioVolatility : 0;
  }

  private calculateMaxDrawdown(positions: LPPosition[]): number {
    // Mock calculation - would need historical position values
    return 15; // 15% max drawdown
  }

  private calculateValueAtRisk(positions: LPPosition[], poolsData: PoolData[]): number {
    // 95% VaR calculation
    const portfolioValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const portfolioVolatility = this.calculatePortfolioVolatility(positions, poolsData);
    
    // Assuming normal distribution, 95% VaR = 1.645 * volatility
    return portfolioValue * portfolioVolatility * 1.645 / 100;
  }

  // Helper methods
  private estimateTokenVolatility(token0: string, token1: string): number {
    // Mock volatility estimation - would use historical price data
    const volatilities: Record<string, number> = {
      'WETH': 60,
      'USDC': 5,
      'DAI': 8,
      'WBTC': 65,
      'USDT': 6,
    };
    
    const vol0 = volatilities[token0] || 50;
    const vol1 = volatilities[token1] || 50;
    
    return Math.sqrt(vol0 * vol0 + vol1 * vol1); // Combined volatility
  }

  private estimateTokenCorrelation(token0: string, token1: string): number {
    // Mock correlation - would calculate from historical data
    if ((token0 === 'USDC' && token1 === 'DAI') || (token0 === 'DAI' && token1 === 'USDC')) {
      return 10; // Highly correlated stablecoins = low IL risk
    }
    if ((token0 === 'WETH' && token1 === 'WBTC') || (token0 === 'WBTC' && token1 === 'WETH')) {
      return 30; // Somewhat correlated
    }
    return 70; // Uncorrelated = higher IL risk
  }

  private calculateTimeRisk(depositTimestamp: Date): number {
    const daysSinceDeposit = (Date.now() - depositTimestamp.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(50, daysSinceDeposit * 0.5); // Risk increases with time
  }

  private getProtocolMaturityScore(protocol: string): number {
    const maturityScores: Record<string, number> = {
      'Uniswap V3': 95,
      'SushiSwap': 85,
      'Curve': 90,
      'Balancer': 80,
      'Aerodrome': 70,
      'BaseSwap': 50,
    };
    
    return maturityScores[protocol] || 60;
  }

  private getAuditScore(protocol: string): number {
    const auditScores: Record<string, number> = {
      'Uniswap V3': 95,
      'SushiSwap': 90,
      'Curve': 92,
      'Balancer': 88,
      'Aerodrome': 75,
      'BaseSwap': 60,
    };
    
    return auditScores[protocol] || 70;
  }

  private estimateMarketVolatility(): number {
    // Mock market volatility
    return 45;
  }

  private estimateMarketCorrelation(token0: string, token1: string): number {
    // Mock market correlation
    return 60;
  }

  private estimateMacroRisk(): number {
    // Mock macro risk assessment
    return 35;
  }

  private calculateDiversificationBenefit(positions: LPPosition[]): number {
    if (positions.length <= 1) return 0;
    
    // Simple diversification benefit calculation
    return Math.min(0.3, positions.length * 0.05); // Max 30% benefit
  }

  private calculateSizeDiversity(positions: LPPosition[]): number {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const weights = positions.map(p => p.currentValue / totalValue);
    
    // Calculate Herfindahl-Hirschman Index (lower = more diverse)
    const hhi = weights.reduce((sum, weight) => sum + weight * weight, 0);
    
    // Convert to diversity score (higher = more diverse)
    return Math.max(0, (1 - hhi) * 100);
  }

  private calculatePortfolioReturn(positions: LPPosition[], poolsData: PoolData[]): number {
    // Mock portfolio return calculation
    return 12; // 12% annual return
  }

  private calculatePortfolioVolatility(positions: LPPosition[], poolsData: PoolData[]): number {
    // Mock portfolio volatility calculation
    return 25; // 25% annual volatility
  }
}
