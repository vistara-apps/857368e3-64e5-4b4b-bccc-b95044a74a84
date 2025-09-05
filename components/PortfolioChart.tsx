'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChartDataPoint } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface PortfolioChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
}

export function PortfolioChart({ data, title = 'Portfolio Value', height = 300 }: PortfolioChartProps) {
  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      return (
        <div className="glass-card p-3 rounded-lg border border-white/20">
          <p className="text-text-secondary text-sm">{date}</p>
          <p className="text-text-primary font-bold">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-primary text-sm">
              Volume: {formatCurrency(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text-primary">{title}</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            <span className="text-text-secondary text-sm">Portfolio Value</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary/50 rounded-full" />
            <span className="text-text-secondary text-sm">Volume</span>
          </div>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="rgba(255,255,255,0.5)"
              fontSize={12}
            />
            
            <YAxis
              yAxisId="value"
              orientation="left"
              tickFormatter={(value) => formatCurrency(value)}
              stroke="rgba(255,255,255,0.5)"
              fontSize={12}
            />
            
            <YAxis
              yAxisId="volume"
              orientation="right"
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              stroke="rgba(255,255,255,0.3)"
              fontSize={12}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              yAxisId="volume"
              type="monotone"
              dataKey="volume"
              stroke="#3b82f6"
              strokeWidth={1}
              fill="url(#volumeGradient)"
              strokeOpacity={0.5}
            />
            
            <Area
              yAxisId="value"
              type="monotone"
              dataKey="value"
              stroke="#a855f7"
              strokeWidth={3}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
