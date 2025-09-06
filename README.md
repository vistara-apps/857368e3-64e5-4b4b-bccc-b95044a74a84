# LiquidityLink 🌊

**Unify your DeFi liquidity – compare rates, manage positions, and assess risk effortlessly.**

LiquidityLink is an intuitive platform for DeFi users to aggregate liquidity across DEXs and CEXs, manage positions, and evaluate risks, designed for the Base ecosystem and Farcaster integration.

![LiquidityLink Dashboard](https://via.placeholder.com/800x400/1a1b23/ffffff?text=LiquidityLink+Dashboard)

## ✨ Features

### 🔄 Cross-Exchange Rate Comparison
- Real-time comparison of trading rates across various DEXs (Uniswap V3, Aerodrome, BaseSwap)
- Easy-to-understand interface with best rate highlighting
- Price spread analysis and slippage warnings

### 🎯 Unified Liquidity Pool Interface
- Single API and UI to view and interact with liquidity pools across different DeFi protocols
- Consolidated view of all LP positions
- Simplified liquidity provision management

### 🤖 Automated LP Position Rebalancing
- Set parameters for liquidity positions (target APY ranges, impermanent loss thresholds)
- Automatically rebalances LP positions to optimize performance
- Multiple strategy options: Conservative, Balanced, and Aggressive

### 🛡️ Advanced Risk Assessment
- Comprehensive risk analysis including smart contract vulnerabilities
- Impermanent loss projections and protocol-specific risks
- Portfolio-level risk metrics and diversification analysis

### 📱 Farcaster Integration
- Native Farcaster frames for social DeFi interactions
- Share rates and positions directly in Farcaster feeds
- Social notifications and alerts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- A Base network RPC endpoint
- OnchainKit API key (for Base miniapp functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vistara-apps/liquiditylink.git
   cd liquiditylink
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
   NEXT_PUBLIC_CDP_PROJECT_ID=your_coinbase_project_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Blockchain**: Viem, Wagmi, OnchainKit
- **State Management**: Zustand, TanStack Query
- **UI Components**: Radix UI, Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion

### Project Structure

```
liquiditylink/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── settings/         # Settings page
├── components/            # React components
│   ├── AppShell.tsx      # Main layout component
│   ├── FarcasterFrame.tsx # Farcaster integration
│   ├── MetricCard.tsx    # Metric display component
│   ├── RateComparisonTable.tsx # Rate comparison
│   └── ...               # Other components
├── lib/                  # Utility libraries
│   ├── api.ts           # API integration layer
│   ├── rebalancing.ts   # Rebalancing engine
│   ├── risk-assessment.ts # Risk assessment engine
│   ├── types.ts         # TypeScript definitions
│   └── utils.ts         # Utility functions
├── public/              # Static assets
└── tailwind.config.js   # Tailwind configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_BASE_RPC_URL` | Base network RPC endpoint | ✅ |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | OnchainKit API key | ✅ |
| `NEXT_PUBLIC_CDP_PROJECT_ID` | Coinbase Developer Platform project ID | ✅ |
| `NEXT_PUBLIC_FARCASTER_HUB_URL` | Farcaster Hub API endpoint | ❌ |
| `FARCASTER_SIGNER_PRIVATE_KEY` | Farcaster signer private key | ❌ |

### Feature Flags

Enable/disable features using environment variables:

```env
NEXT_PUBLIC_ENABLE_REBALANCING=true
NEXT_PUBLIC_ENABLE_FARCASTER_FRAMES=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS=false
```

## 📊 Core Features Deep Dive

### Rate Comparison Engine

The rate comparison engine fetches real-time data from multiple DEXs:

```typescript
// Example usage
import { fetchExchangeRates } from '@/lib/api';

const rates = await fetchExchangeRates('WETH/USDC');
const bestRate = rates.reduce((best, current) => 
  current.rate > best.rate ? current : best
);
```

### Rebalancing Strategies

Three built-in strategies with customizable parameters:

1. **Conservative Growth** (5% target APY, 2% max IL)
2. **Balanced Optimization** (8% target APY, 5% max IL)  
3. **Aggressive Yield** (15% target APY, 10% max IL)

```typescript
// Create custom strategy
import { createCustomStrategy } from '@/lib/rebalancing';

const strategy = createCustomStrategy(
  'My Strategy',
  12, // target APY
  7,  // max impermanent loss
  'medium' // risk tolerance
);
```

### Risk Assessment

Advanced risk scoring across multiple dimensions:

- **Impermanent Loss Risk**: Based on token volatility and correlation
- **Smart Contract Risk**: Protocol maturity, audits, and TVL
- **Liquidity Risk**: Pool depth, volume, and utilization
- **Protocol Risk**: Governance and operational risks
- **Market Risk**: Broader market conditions

## 🎨 Design System

LiquidityLink uses a custom design system built on Tailwind CSS:

### Color Palette
- **Primary**: `hsl(200 90% 55%)` - Bright blue
- **Accent**: `hsl(320 90% 60%)` - Vibrant pink
- **Background**: `hsl(210 30% 12%)` - Dark blue-gray
- **Surface**: `hsl(210 30% 15%)` - Slightly lighter surface

### Components
- Glass morphism effects with backdrop blur
- Gradient buttons and accents
- Responsive grid system (12-column)
- Consistent spacing and typography

## 🔌 API Integration

### Supported DEXs

- **Uniswap V3**: Primary DEX with comprehensive subgraph integration
- **Aerodrome**: Base-native DEX with competitive rates
- **BaseSwap**: Community-driven DEX on Base

### Data Sources

- **The Graph**: Uniswap V3 subgraph for pool data
- **Base RPC**: Direct blockchain queries
- **Farcaster Hubs**: Social integration and notifications

## 🧪 Testing

Run the test suite:

```bash
npm run test
# or
yarn test
```

Run tests in watch mode:

```bash
npm run test:watch
# or
yarn test:watch
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.liquiditylink.app](https://docs.liquiditylink.app)
- **Discord**: [Join our community](https://discord.gg/liquiditylink)
- **Twitter**: [@LiquidityLink](https://twitter.com/liquiditylink)
- **Email**: support@liquiditylink.app

## 🙏 Acknowledgments

- [Base](https://base.org) for the amazing L2 infrastructure
- [OnchainKit](https://onchainkit.xyz) for Base miniapp tools
- [Farcaster](https://farcaster.xyz) for social DeFi integration
- [Uniswap](https://uniswap.org) for the foundational DEX protocol

---

**Built with ❤️ for the Base ecosystem**
