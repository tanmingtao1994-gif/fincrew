// Data Model for AI Financial Assistant
// Based on data-model.md

// --- 1. Market Data Entities ---

export interface StockData {
  // Identification
  ticker: string;              // e.g., "AAPL", "0700.HK"
  name: string;                // Company name
  exchange: string;            // e.g., "NASDAQ", "HKEX"
  currency: string;            // e.g., "USD", "HKD"

  // Market Data
  price: number;               // Current price
  change: number;              // Price change
  changePercent: number;       // Price change percent
  volume: number;              // Volume
  marketCap: number;           // Market capitalization

  // Timestamps
  timestamp: Date | string;    // Data timestamp
  lastUpdate: Date | string;   // Last update time

  // Metadata
  source: string;              // e.g., "Yahoo Finance"
}

export interface TechnicalIndicator {
  ticker: string;
  indicator: string;           // e.g., "MA", "RSI", "MACD"
  timeframe: string;           // e.g., "1d", "1wk", "1mo"

  values: {
    [key: string]: number;     // Dynamic values based on indicator type
  };

  timestamp: Date | string;
  lastUpdate: Date | string;
}

export interface MarketNews {
  id: string;
  title: string;
  content: string;             // Content or summary
  url: string;

  source: string;              // e.g., "Reuters", "Bloomberg"
  author?: string;
  category: string;            // e.g., "Earnings", "M&A"

  relatedTickers: string[];
  sentiment: 'positive' | 'negative' | 'neutral';

  publishedAt: Date | string;
  scrapedAt: Date | string;
}

export interface KOLView {
  id: string;
  kolName: string;
  kolHandle: string;           // e.g., "@trader_joe"
  platform: string;            // e.g., "Twitter", "YouTube"

  content: string;
  type: 'recommendation' | 'analysis' | 'prediction';

  recommendedTickers: string[];
  action: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;          // 0-1

  postedAt: Date | string;
  scrapedAt: Date | string;
}

export interface OptionData {
  ticker: string;
  contractSymbol: string;
  type: 'call' | 'put';

  strikePrice: number;
  expirationDate: Date | string;
  daysToExpiration: number;

  bid: number;
  ask: number;
  lastPrice: number;
  impliedVolatility: number;   // %

  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };

  ivr: number;                 // Implied Volatility Rank (0-100)
  ivRvSpread: number;          // IV - RV Spread
  maxPain: number;

  timestamp: Date | string;
}

// --- 2. Decision Analysis Entities ---

export interface MarketAnalysis {
  id: string;
  timestamp: Date | string;

  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;             // -1 to 1
    factors: {
      news: number;
      social: number;
      technical: number;
    };
  };

  sectors: {
    [sectorName: string]: {
      trend: 'up' | 'down' | 'sideways';
      strength: number;        // 0-1
      topStocks: string[];
    };
  };

  hotTopics: string[];
  hotStocks: string[];

  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface StockAnalysis {
  ticker: string;
  id: string;
  timestamp: Date | string;

  conclusion: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;          // 0-1

  assessment: {
    fundamental: {
      score: number;           // 0-1
      keyPoints: string[];
    };
    technical: {
      score: number;           // 0-1
      keyPoints: string[];
    };
    sentiment: {
      score: number;           // 0-1
      keyPoints: string[];
    };
  };

  risk: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    stopLoss: number;
  };

  recommendation: {
    action: 'buy' | 'sell' | 'hold' | 'watch';
    entryPrice: number;
    targetPrice: number;
    timeHorizon: string;       // e.g., "1-3 months"
    positionSize: number;      // %
  };

  rationale: string;
  sources: string[];
}

export interface TradingPlan {
  id: string;
  timestamp: Date | string;

  ticker: string;
  action: 'buy' | 'sell' | 'day_trade';

  execution: {
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
    quantity: number;
    timing: 'immediate' | 'conditional';
    condition?: string;
  };

  riskControls: {
    stopLoss: number;
    takeProfit: number;
    maxLoss: number;
    positionSize: number;      // % of portfolio
  };

  reasoning: string;
  analysisId: string;
  memoryIds: string[];

  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'user_confirmed';
  statusHistory: {
    status: string;
    timestamp: Date | string;
    reason?: string;
  }[];
}

export interface RiskControl {
  id: string;
  tradingPlanId: string;

  stopLoss: {
    enabled: boolean;
    price: number;
    type: 'fixed' | 'percentage' | 'trailing';
    trailingPercent?: number;
  };

  takeProfit: {
    enabled: boolean;
    price: number;
    type: 'fixed' | 'percentage';
  };

  positionSizing: {
    method: 'fixed' | 'percentage' | 'kelly' | 'risk_parity';
    maxPositionSize: number;     // %
    riskPerTrade: number;      // %
  };

  dailyLimits: {
    maxLoss: number;
    maxTrades: number;
  };
}

// --- 3. Execution Entities ---

export interface TradeRecord {
  id: string;
  tradingPlanId: string;

  ticker: string;
  action: 'buy' | 'sell' | 'day_trade_buy' | 'day_trade_sell';
  quantity: number;
  price: number;

  execution: {
    orderId: string;
    timestamp: Date | string;
    status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected';
    filledQuantity: number;
    averagePrice: number;
    commission: number;
  };

  financials: {
    totalCost: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
  };

  notes: string;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReviewResult {
  id: string;
  tradeId: string;
  timestamp: Date | string;

  evaluation: {
    success: boolean;
    score: number;             // 0-1
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };

  analysis: {
    decisionQuality: {
      score: number;
      reasoning: string;
    };
    executionQuality: {
      score: number;
      reasoning: string;
    };
    timing: {
      score: number;
      reasoning: string;
    };
  };

  lessons: {
    whatWentWell: string[];
    whatWentWrong: string[];
    improvements: string[];
  };

  memoryUpdates: {
    principles: string[];
    patterns: string[];
    lessons: string[];
  };

  followUp: {
    needsReview: boolean;
    reviewDate?: Date | string;
    actions: string[];
  };
}

// --- 4. User Entities ---

export interface UserPortfolio {
  userId: string;
  timestamp: Date | string;

  holdings: {
    [ticker: string]: {
      quantity: number;
      averageCost: number;
      currentPrice: number;
      marketValue: number;
      profitLoss: number;
      profitLossPercent: number;
    };
  };

  summary: {
    totalValue: number;
    totalCost: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    cashBalance: number;
  };

  riskMetrics: {
    portfolioBeta: number;
    portfolioVolatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface Watchlist {
  userId: string;
  timestamp: Date | string;

  items: {
    [ticker: string]: {
      addedAt: Date | string;
      reason: string;
      notes?: string;
      alertPrice?: number;
      alertDirection?: 'above' | 'below';
    };
  };

  summary: {
    totalItems: number;
    categories: string[];
  };
}

export interface UserPreference {
  userId: string;
  timestamp: Date | string;

  riskTolerance: {
    level: 'conservative' | 'moderate' | 'aggressive';
    maxDrawdown: number;      // %
    maxPositionSize: number;   // %
  };

  investmentStyle: {
    horizon: 'short' | 'medium' | 'long';
    approach: 'value' | 'growth' | 'technical' | 'balanced';
    tradingFrequency: 'low' | 'medium' | 'high';
  };

  returnExpectations: {
    targetReturn: number;      // %
    minAcceptableReturn: number; // %
  };

  tradingPreferences: {
    useStopLoss: boolean;
    useTakeProfit: boolean;
    dayTradingEnabled: boolean;
    optionsTradingEnabled: boolean;
  };

  notificationPreferences: {
    tradeAlerts: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
    reviewAlerts: boolean;
  };
}
