// Application configuration constants

export const config = {
  // OnchainKit
  onchainKit: {
    apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'cdp_demo_key',
  },

  // Base Network
  base: {
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453,
    name: 'Base',
    currency: 'ETH',
  },

  // Uniswap V3
  uniswap: {
    subgraphUrl: process.env.NEXT_PUBLIC_UNISWAP_SUBGRAPH_URL || 
      'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base',
    factoryAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    routerAddress: '0x2626664c2603336E57B271c5C0b26F421741e481',
  },

  // Farcaster
  farcaster: {
    hubUrl: process.env.NEXT_PUBLIC_FARCASTER_HUB_URL || 'https://hub.farcaster.xyz',
    apiVersion: 'v1',
  },

  // Application
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    name: 'LiquidityLink',
    description: 'Unify your DeFi liquidity – compare rates, manage positions, and assess risk effortlessly.',
  },

  // API Configuration
  api: {
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100'),
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // Cache Configuration
  cache: {
    defaultTTL: 300, // 5 minutes
    poolDataTTL: 60, // 1 minute for pool data
    rateDataTTL: 30, // 30 seconds for exchange rates
    userDataTTL: 3600, // 1 hour for user data
  },

  // Business Logic
  rebalancing: {
    minPositionValue: 100, // Minimum $100 position to rebalance
    maxSlippage: 0.005, // 0.5% max slippage
    gasBuffer: 1.2, // 20% gas buffer
    checkInterval: 300000, // Check every 5 minutes
  },

  // Risk Assessment
  risk: {
    impermanentLossThreshold: 0.05, // 5% IL threshold
    liquidityThreshold: 100000, // $100k minimum liquidity
    protocolRiskWeights: {
      smartContract: 0.3,
      liquidity: 0.25,
      impermanentLoss: 0.25,
      protocol: 0.2,
    },
  },

  // Supported Protocols
  protocols: {
    uniswapV3: {
      name: 'Uniswap V3',
      factoryAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
      enabled: true,
      riskScore: 25,
    },
    aerodrome: {
      name: 'Aerodrome',
      factoryAddress: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
      enabled: true,
      riskScore: 35,
    },
    baseswap: {
      name: 'BaseSwap',
      factoryAddress: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
      enabled: true,
      riskScore: 55,
    },
    sushiswap: {
      name: 'SushiSwap',
      factoryAddress: '0x71524B4f93c58fcbF659783284E38825f0622859',
      enabled: true,
      riskScore: 30,
    },
  },

  // Common Token Addresses on Base
  tokens: {
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    WBTC: '0x1C9491865a1DE77C5b6e19d2E6a5F1D7a6F2b25F',
  },
} as const;

export type Config = typeof config;
