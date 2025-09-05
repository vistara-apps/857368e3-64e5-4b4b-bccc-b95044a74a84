'use client';

import { Shield, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { RiskAssessment } from '@/lib/types';
import { getRiskColor, getRiskLabel } from '@/lib/utils';

interface RiskInsightProps {
  assessment: RiskAssessment;
  className?: string;
}

export function RiskInsight({ assessment, className = '' }: RiskInsightProps) {
  const riskFactors = [
    {
      name: 'Impermanent Loss',
      score: assessment.impermanentLoss,
      description: 'Risk of loss due to price divergence between paired tokens',
      icon: TrendingDown,
    },
    {
      name: 'Smart Contract',
      score: assessment.smartContract,
      description: 'Risk from potential smart contract vulnerabilities',
      icon: Shield,
    },
    {
      name: 'Liquidity Risk',
      score: assessment.liquidity,
      description: 'Risk from low liquidity or sudden withdrawals',
      icon: AlertTriangle,
    },
    {
      name: 'Protocol Risk',
      score: assessment.protocol,
      description: 'Risk from protocol governance and operational changes',
      icon: Info,
    },
  ];

  return (
    <div className={`glass-card p-6 rounded-xl ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-text-primary">Risk Assessment</h3>
          <p className="text-text-secondary text-sm">Comprehensive risk analysis</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRiskColor(assessment.overall)}`}>
            {assessment.overall}/100
          </div>
          <div className={`text-sm ${getRiskColor(assessment.overall)}`}>
            {getRiskLabel(assessment.overall)}
          </div>
        </div>
      </div>

      {/* Overall Risk Gauge */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-secondary text-sm">Overall Risk Score</span>
          <span className={`font-bold ${getRiskColor(assessment.overall)}`}>
            {assessment.overall}%
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              assessment.overall >= 80
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : assessment.overall >= 60
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : assessment.overall >= 40
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-green-500 to-yellow-500'
            }`}
            style={{ width: `${assessment.overall}%` }}
          />
        </div>
      </div>

      {/* Risk Factors */}
      <div className="space-y-4">
        <h4 className="font-semibold text-text-primary mb-3">Risk Breakdown</h4>
        {riskFactors.map((factor) => (
          <div key={factor.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <factor.icon className="w-4 h-4 text-text-secondary" />
                <span className="text-text-primary font-medium">{factor.name}</span>
              </div>
              <span className={`font-bold ${getRiskColor(factor.score)}`}>
                {factor.score}%
              </span>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  factor.score >= 80
                    ? 'bg-error'
                    : factor.score >= 60
                    ? 'bg-warning'
                    : factor.score >= 40
                    ? 'bg-yellow-400'
                    : 'bg-success'
                }`}
                style={{ width: `${factor.score}%` }}
              />
            </div>
            
            <p className="text-text-secondary text-xs">{factor.description}</p>
          </div>
        ))}
      </div>

      {/* Risk Recommendations */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium text-sm">Recommendations</p>
            <ul className="text-text-secondary text-sm mt-1 space-y-1">
              {assessment.overall >= 60 && (
                <li>• Consider reducing position size or diversifying across protocols</li>
              )}
              {assessment.impermanentLoss >= 50 && (
                <li>• Monitor token price correlation closely</li>
              )}
              {assessment.liquidity >= 50 && (
                <li>• Ensure sufficient exit liquidity before large positions</li>
              )}
              <li>• Set up automated alerts for significant risk changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
