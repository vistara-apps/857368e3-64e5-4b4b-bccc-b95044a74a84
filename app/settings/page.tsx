'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Wallet, 
  Zap, 
  Target, 
  AlertTriangle,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { MetricCard } from '@/components/MetricCard';
import { 
  RebalancingStrategy, 
  DEFAULT_STRATEGIES, 
  createCustomStrategy, 
  validateStrategy 
} from '@/lib/rebalancing';

interface NotificationSettings {
  rateAlerts: boolean;
  rebalanceRecommendations: boolean;
  riskWarnings: boolean;
  portfolioUpdates: boolean;
  priceThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface UserPreferences {
  defaultTokenPair: string;
  refreshInterval: number;
  riskTolerance: 'low' | 'medium' | 'high';
  autoRebalancing: boolean;
  slippageTolerance: number;
  gasOptimization: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'strategies' | 'notifications' | 'advanced'>('general');
  const [strategies, setStrategies] = useState<RebalancingStrategy[]>(DEFAULT_STRATEGIES);
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<RebalancingStrategy | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    rateAlerts: true,
    rebalanceRecommendations: true,
    riskWarnings: true,
    portfolioUpdates: false,
    priceThreshold: 5,
    emailNotifications: true,
    pushNotifications: false,
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultTokenPair: 'WETH/USDC',
    refreshInterval: 30,
    riskTolerance: 'medium',
    autoRebalancing: false,
    slippageTolerance: 0.5,
    gasOptimization: true,
  });

  const [newStrategy, setNewStrategy] = useState({
    name: '',
    targetAPY: 8,
    maxImpermanentLoss: 5,
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    // Load saved settings from localStorage or API
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedStrategies = localStorage.getItem('liquiditylink-strategies');
      const savedNotifications = localStorage.getItem('liquiditylink-notifications');
      const savedPreferences = localStorage.getItem('liquiditylink-preferences');

      if (savedStrategies) {
        setStrategies(JSON.parse(savedStrategies));
      }
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('liquiditylink-strategies', JSON.stringify(strategies));
      localStorage.setItem('liquiditylink-notifications', JSON.stringify(notifications));
      localStorage.setItem('liquiditylink-preferences', JSON.stringify(preferences));
      
      // Here you would also sync with backend API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const createNewStrategy = () => {
    const errors = validateStrategy({
      ...createCustomStrategy(
        newStrategy.name,
        newStrategy.targetAPY,
        newStrategy.maxImpermanentLoss,
        newStrategy.riskTolerance
      ),
      enabled: false,
    });

    if (errors.length > 0) {
      alert('Validation errors:\n' + errors.join('\n'));
      return;
    }

    const strategy = createCustomStrategy(
      newStrategy.name,
      newStrategy.targetAPY,
      newStrategy.maxImpermanentLoss,
      newStrategy.riskTolerance
    );

    setStrategies([...strategies, strategy]);
    setIsCreatingStrategy(false);
    setNewStrategy({
      name: '',
      targetAPY: 8,
      maxImpermanentLoss: 5,
      riskTolerance: 'medium',
    });
  };

  const toggleStrategy = (strategyId: string) => {
    setStrategies(strategies.map(s => 
      s.id === strategyId ? { ...s, enabled: !s.enabled } : { ...s, enabled: false }
    ));
  };

  const deleteStrategy = (strategyId: string) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      setStrategies(strategies.filter(s => s.id !== strategyId));
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'strategies', label: 'Strategies', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
            <p className="text-text-secondary">Configure your LiquidityLink experience</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="btn-primary flex items-center space-x-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card p-1 rounded-xl">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-text-primary mb-4">General Preferences</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Default Token Pair
                    </label>
                    <select
                      value={preferences.defaultTokenPair}
                      onChange={(e) => setPreferences({...preferences, defaultTokenPair: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                    >
                      <option value="WETH/USDC">WETH/USDC</option>
                      <option value="WETH/DAI">WETH/DAI</option>
                      <option value="USDC/DAI">USDC/DAI</option>
                      <option value="WBTC/WETH">WBTC/WETH</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Refresh Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={preferences.refreshInterval}
                      onChange={(e) => setPreferences({...preferences, refreshInterval: parseInt(e.target.value)})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Risk Tolerance
                    </label>
                    <select
                      value={preferences.riskTolerance}
                      onChange={(e) => setPreferences({...preferences, riskTolerance: e.target.value as any})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                    >
                      <option value="low">Low Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="high">High Risk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Slippage Tolerance (%)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={preferences.slippageTolerance}
                      onChange={(e) => setPreferences({...preferences, slippageTolerance: parseFloat(e.target.value)})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary">Auto Rebalancing</h4>
                      <p className="text-sm text-text-secondary">Automatically execute rebalancing recommendations</p>
                    </div>
                    <button
                      onClick={() => setPreferences({...preferences, autoRebalancing: !preferences.autoRebalancing})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.autoRebalancing ? 'bg-primary' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.autoRebalancing ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary">Gas Optimization</h4>
                      <p className="text-sm text-text-secondary">Optimize transactions for lower gas costs</p>
                    </div>
                    <button
                      onClick={() => setPreferences({...preferences, gasOptimization: !preferences.gasOptimization})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.gasOptimization ? 'bg-primary' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.gasOptimization ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-text-primary">Rebalancing Strategies</h3>
                <button
                  onClick={() => setIsCreatingStrategy(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Strategy</span>
                </button>
              </div>

              {/* Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={`glass-card p-6 rounded-xl border-2 transition-all ${
                      strategy.enabled 
                        ? 'border-success/50 bg-success/5' 
                        : 'border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-text-primary">{strategy.name}</h4>
                        <p className="text-sm text-text-secondary mt-1">{strategy.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        {!strategy.id.startsWith('custom-') ? null : (
                          <>
                            <button
                              onClick={() => setEditingStrategy(strategy)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Edit3 className="w-4 h-4 text-text-secondary" />
                            </button>
                            <button
                              onClick={() => deleteStrategy(strategy.id)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-error" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Target APY</span>
                        <span className="text-text-primary font-medium">{strategy.targetAPY}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Max IL</span>
                        <span className="text-text-primary font-medium">{strategy.maxImpermanentLoss}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Risk Tolerance</span>
                        <span className={`font-medium capitalize ${
                          strategy.riskTolerance === 'low' ? 'text-success' :
                          strategy.riskTolerance === 'medium' ? 'text-warning' : 'text-error'
                        }`}>
                          {strategy.riskTolerance}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStrategy(strategy.id)}
                      className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors ${
                        strategy.enabled
                          ? 'bg-success text-white'
                          : 'bg-white/10 text-text-primary hover:bg-white/20'
                      }`}
                    >
                      {strategy.enabled ? 'Active' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Create Strategy Modal */}
              {isCreatingStrategy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="glass-card p-6 rounded-xl max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-text-primary mb-4">Create Custom Strategy</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Strategy Name
                        </label>
                        <input
                          type="text"
                          value={newStrategy.name}
                          onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                          placeholder="My Custom Strategy"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Target APY (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newStrategy.targetAPY}
                          onChange={(e) => setNewStrategy({...newStrategy, targetAPY: parseFloat(e.target.value)})}
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Max Impermanent Loss (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={newStrategy.maxImpermanentLoss}
                          onChange={(e) => setNewStrategy({...newStrategy, maxImpermanentLoss: parseFloat(e.target.value)})}
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Risk Tolerance
                        </label>
                        <select
                          value={newStrategy.riskTolerance}
                          onChange={(e) => setNewStrategy({...newStrategy, riskTolerance: e.target.value as any})}
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                        >
                          <option value="low">Low Risk</option>
                          <option value="medium">Medium Risk</option>
                          <option value="high">High Risk</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setIsCreatingStrategy(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createNewStrategy}
                        className="btn-primary flex-1"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-xl font-bold text-text-primary mb-6">Notification Settings</h3>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary">Alert Types</h4>
                  
                  {[
                    { key: 'rateAlerts', label: 'Rate Change Alerts', desc: 'Get notified when rates change significantly' },
                    { key: 'rebalanceRecommendations', label: 'Rebalancing Recommendations', desc: 'Receive suggestions for position optimization' },
                    { key: 'riskWarnings', label: 'Risk Warnings', desc: 'Alerts for high-risk situations' },
                    { key: 'portfolioUpdates', label: 'Portfolio Updates', desc: 'Daily portfolio performance summaries' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-text-primary">{item.label}</h5>
                        <p className="text-sm text-text-secondary">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({
                          ...notifications,
                          [item.key]: !notifications[item.key as keyof NotificationSettings]
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications[item.key as keyof NotificationSettings] ? 'bg-primary' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[item.key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Price Change Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={notifications.priceThreshold}
                    onChange={(e) => setNotifications({...notifications, priceThreshold: parseFloat(e.target.value)})}
                    className="w-full max-w-xs p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary">Delivery Methods</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-text-primary">Email Notifications</h5>
                      <p className="text-sm text-text-secondary">Receive alerts via email</p>
                    </div>
                    <button
                      onClick={() => setNotifications({...notifications, emailNotifications: !notifications.emailNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.emailNotifications ? 'bg-primary' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-text-primary">Push Notifications</h5>
                      <p className="text-sm text-text-secondary">Browser push notifications</p>
                    </div>
                    <button
                      onClick={() => setNotifications({...notifications, pushNotifications: !notifications.pushNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.pushNotifications ? 'bg-primary' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                  <h3 className="text-xl font-bold text-text-primary">Advanced Settings</h3>
                </div>
                <p className="text-text-secondary mb-6">
                  These settings are for advanced users. Changing them may affect app performance.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-text-primary mb-4">API Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Custom RPC Endpoint
                        </label>
                        <input
                          type="url"
                          placeholder="https://mainnet.base.org"
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Subgraph URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base"
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-text-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-text-primary mb-4">Data & Privacy</h4>
                    <div className="space-y-4">
                      <button className="btn-secondary w-full">
                        Export Portfolio Data
                      </button>
                      <button className="btn-secondary w-full">
                        Clear Cache
                      </button>
                      <button className="bg-error hover:bg-error/80 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full">
                        Reset All Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
