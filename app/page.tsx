'use client';

import { useEffect, useState } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Wallet, TrendingUp, Shield, DollarSign, Activity, Users } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { MetricCard } from '@/components/MetricCard';
import { RateComparisonTable } from '@/components/RateComparisonTable';
import { LPPositionManager } from '@/components/LPPositionManager';
import { RiskInsight } from '@/components/RiskInsight';
import { PortfolioChart } from '@/components/PortfolioChart';
import { generateMockData } from '@/lib/utils';
import { usePoolData } from '@/hooks/usePoolData';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useAuth } from '@/contexts/AuthContext';
import { riskAssessmentEngine } from '@/lib/risk/assessment';

export default function HomePage() {
  const { setFrameReady } = useMiniKit();
  const { user, isConnected } = useAuth();
  const [data, setData] = useState(generateMockData());
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch real data using our custom hooks
  const { pools, isLoading: poolsLoading, error: poolsError } = usePoolData(10);
  const { rates, isLoading: ratesLoading, error: ratesError } = useExchangeRates('WETH', 'USDC');

  useEffect(() => {
    // Initialize MiniKit frame
    setFrameReady();
    
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setFrameReady]);

  // Update data when real data is available
  useEffect(() => {
    if (pools.length > 0 && rates.length > 0) {
      setData(prevData => ({
        ...prevData,
        liquiditySources: pools,
        rateComparisons: rates,
      }));
    }
  }, [pools, rates]);

  // Calculate real risk assessment based on current pools
  const riskAssessment = pools.length > 0 
    ? riskAssessmentEngine.assessPortfolio(pools)
    : {
        overall: 35,
        impermanentLoss: 25,
        smartContract: 20,
        liquidity: 45,
        protocol: 30,
      };

  const isLoading = isInitialLoading || (poolsLoading && ratesLoading);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
              <span className="text-white font-bold text-xl">LL</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Loading LiquidityLink</h2>
              <p className="text-text-secondary">Fetching your DeFi data...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            Unify Your DeFi Liquidity
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Compare rates, manage positions, and assess risk effortlessly across DEXs and CEXs on Base.
          </p>
          
          {/* Connection Status */}
          {!isConnected && (
            <div className="glass-card p-4 rounded-lg max-w-md mx-auto">
              <p className="text-text-secondary text-sm">
                Connect your wallet to access personalized features and manage your positions.
              </p>
            </div>
          )}
          
          {/* Data Status */}
          {(poolsError || ratesError) && (
            <div className="glass-card p-4 rounded-lg max-w-md mx-auto border-warning/20">
              <p className="text-warning text-sm">
                {poolsError || ratesError} - Showing cached data.
              </p>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Portfolio Value"
            value={`$${data.portfolioMetrics.totalValue.toLocaleString()}`}
            change="+12.5%"
            changeType="positive"
            subtitle="Last 30 days"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Earnings"
            value={`$${data.portfolioMetrics.totalEarnings.toLocaleString()}`}
            change="+8.3%"
            changeType="positive"
            subtitle="This month"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricCard
            title="Active Positions"
            value={data.portfolioMetrics.totalPositions.toString()}
            subtitle="Across 4 protocols"
            icon={<Wallet className="w-5 h-5" />}
          />
          <MetricCard
            title="Average APY"
            value={`${data.portfolioMetrics.avgAPY}%`}
            change="+1.2%"
            changeType="positive"
            subtitle="Weighted average"
            icon={<Activity className="w-5 h-5" />}
          />
        </div>

        {/* Portfolio Chart */}
        <PortfolioChart
          data={data.chartData}
          title="Portfolio Performance"
          height={400}
        />

        {/* Rate Comparison */}
        <RateComparisonTable
          rates={data.rateComparisons}
          pair="WETH/USDC"
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LP Position Manager */}
          <div>
            <LPPositionManager pools={data.liquiditySources} />
          </div>

          {/* Risk Assessment */}
          <div>
            <RiskInsight assessment={riskAssessment} />
          </div>
        </div>

        {/* Liquidity Sources Overview */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-text-primary">Top Liquidity Sources</h3>
              <p className="text-text-secondary text-sm">Best performing protocols on Base</p>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-text-secondary">Live data</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.liquiditySources.slice(0, 4).map((source, index) => (
              <div key={source.protocol} className="glass-card p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {source.protocol.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-text-primary">{source.protocol}</span>
                  </div>
                  <span className="text-success font-bold">{source.apy.toFixed(2)}%</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">TVL</span>
                    <span className="text-text-primary font-mono">
                      ${(source.tvl / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">24h Volume</span>
                    <span className="text-text-primary font-mono">
                      ${(source.volume24h / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Risk</span>
                    <span className={`font-medium ${
                      source.riskScore < 30 ? 'text-success' :
                      source.riskScore < 60 ? 'text-warning' : 'text-error'
                    }`}>
                      {source.riskScore < 30 ? 'Low' :
                       source.riskScore < 60 ? 'Medium' : 'High'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="glass-card p-8 rounded-xl text-center neon-border">
          <div className="space-y-4">
            <Shield className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-2xl font-bold text-text-primary">
              Ready to Optimize Your DeFi Strategy?
            </h3>
            <p className="text-text-secondary max-w-md mx-auto">
              Get personalized recommendations, automated rebalancing, and advanced risk analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button className="btn-primary">
                Upgrade to Pro
              </button>
              <button className="btn-secondary">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
