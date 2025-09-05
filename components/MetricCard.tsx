'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricCardProps } from '@/lib/types';

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  subtitle, 
  icon 
}: MetricCardProps) {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-error" />;
      default:
        return <Minus className="w-4 h-4 text-text-secondary" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <div className="metric-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <div className="text-primary">{icon}</div>}
            <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            
            {change && (
              <div className="flex items-center space-x-1">
                {getChangeIcon()}
                <span className={`text-sm font-medium ${getChangeColor()}`}>
                  {change}
                </span>
              </div>
            )}
            
            {subtitle && (
              <p className="text-xs text-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
