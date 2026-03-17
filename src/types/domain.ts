// Market Data Entities

export interface StockData {
  // Identification
  ticker: string;              // e.g. "AAPL", "0700.HK"
  name: string;                // Company name
  exchange: string;            // e.g. "NASDAQ", "HKEX"
  currency: string;            // e.g. "USD", "HKD"

  // Market Data
  price: number;               // Current price
  change: number;              // Price change
  changePercent: number;       // Price change percentage
  volume: number;              // Trading volume
  marketCap: number;           // Market capitalization

  // Timestamps
  timestamp: Date | string;    // Data timestamp
  lastUpdate: Date | string;   // Last update timestamp

  // Metadata
  source: string;              // e.g. "Yahoo Finance"
}

export interface TechnicalIndicator {
  // Identification
  ticker: string;
  indicator: string;           // e.g. "MA", "RSI", "MACD"
  timeframe: string;           // e.g. "1d", "1wk", "1mo"

  // Values
  values: {
    [key: string]: number;     // e.g. { "MA20": 150.5 }
  };

  // Timestamps
  timestamp: Date | string;
  lastUpdate: Date | string;
}

export interface MarketNews {
  // Identification
  id: string;
  title: string;
  content: string;
  url: string;

  // Metadata
  source: string;
  author?: string;
  category: string;

  // Relevance
  relatedTickers: string[];
  sentiment: 'positive' | 'negative' | 'neutral';

  // Timestamps
  publishedAt: Date | string;
  scrapedAt: Date | string;
}

export interface KOLView {
  // Identification
  id: string;
  kolName: string;
  kolHandle: string;
  platform: string;           // e.g. "Twitter", "YouTube"

  // Content
  content: string;
  type: 'recommendation' | 'analysis' | 'prediction';

  // Recommendation Details
  recommendedTickers: string[];
  action: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;          // 0-1

  // Timestamps
  postedAt: Date | string;
  scrapedAt: Date | string;
}

export interface OptionData {
  // Identification
  ticker: string;
  contractSymbol: string;
  type: 'call' | 'put';

  // Contract Details
  strikePrice: number;
  expirationDate: Date | string;
  daysToExpiration: number;

  // Pricing
  bid: number;
  ask: number;
  lastPrice: number;
  impliedVolatility: number;    // %

  // Greeks
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };

  // Analysis
  ivr: number;                // 0-100
  ivRvSpread: number;
  maxPain: number;

  // Timestamps
  timestamp: Date | string;
}

// Analysis & Decision Entities

export interface MarketAnalysis {
  // Identification
  id: string;
  timestamp: Date | string;

  // Sentiment
  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;             // -1 to 1
    factors: {
      news: number;
      social: number;
      technical: number;
    };
  };

  // Sectors
  sectors: {
    [sectorName: string]: {
      trend: 'up' | 'down' | 'sideways';
      strength: number;        // 0-1
      topStocks: string[];
    };
  };

  // Hot Topics
  hotTopics: string[];
  hotStocks: string[];

  // Risk
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface StockAnalysis {
  // Identification
  ticker: string;
  id: string;
  timestamp: Date | string;

  // Conclusion
  conclusion: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;          // 0-1

  // Assessment
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

  // Risk
  risk: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    stopLoss: number;
  };

  // Recommendation
  recommendation: {
    action: 'buy' | 'sell' | 'hold' | 'watch';
    entryPrice: number;
    targetPrice: number;
    timeHorizon: string;
    positionSize: number;      // %
  };

  // Rationale
  rationale: string;
  sources: string[];
}

export interface RiskControl {
  // Identification
  id: string;
  tradingPlanId: string;

  // Parameters
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

  // Position Sizing
  positionSizing: {
    method: 'fixed' | 'percentage' | 'kelly' | 'risk_parity';
    maxPositionSize: number;     // %
    riskPerTrade: number;      // %
  };

  // Limits
  dailyLimits: {
    maxLoss: number;
    maxTrades: number;
  };
}

export interface TradingPlan {
  // Identification
  id: string;
  timestamp: Date | string;

  // Details
  ticker: string;
  action: 'buy' | 'sell' | 'day_trade';

  // Execution
  execution: {
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
    quantity: number;
    timing: 'immediate' | 'conditional';
    condition?: string;
  };

  // Risk Controls
  riskControls: {
    stopLoss: number;
    takeProfit: number;
    maxLoss: number;
    positionSize: number;      // %
  };

  // Rationale
  reasoning: string;
  analysisId: string;
  memoryIds: string[];

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'user_confirmed';
  statusHistory: {
    status: string;
    timestamp: Date | string;
    reason?: string;
  }[];
}

// Execution Entities

export interface TradeRecord {
  // Identification
  id: string;
  tradingPlanId: string;

  // Details
  ticker: string;
  action: 'buy' | 'sell' | 'day_trade_buy' | 'day_trade_sell';
  quantity: number;
  price: number;

  // Execution
  execution: {
    orderId: string;
    timestamp: Date | string;
    status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected';
    filledQuantity: number;
    averagePrice: number;
    commission: number;
  };

  // Financials
  financials: {
    totalCost: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
  };

  // Metadata
  notes: string;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReviewResult {
  // Identification
  id: string;
  tradeId: string;
  timestamp: Date | string;

  // Evaluation
  evaluation: {
    success: boolean;
    score: number;             // 0-1
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };

  // Analysis
  analysis: {
    decisionQuality: {
      score: number;           // 0-1
      reasoning: string;
    };
    executionQuality: {
      score: number;           // 0-1
      reasoning: string;
    };
    timing: {
      score: number;           // 0-1
      reasoning: string;
    };
  };

  // Lessons
  lessons: {
    whatWentWell: string[];
    whatWentWrong: string[];
    improvements: string[];
  };

  // Updates
  memoryUpdates: {
    principles: string[];
    patterns: string[];
    lessons: string[];
  };

  // Follow Up
  followUp: {
    needsReview: boolean;
    reviewDate?: Date | string;
    actions: string[];
  };
}

// User Entities

export interface UserPortfolio {
  // Identification
  userId: string;
  timestamp: Date | string;

  // Holdings
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

  // Summary
  summary: {
    totalValue: number;
    totalCost: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    cashBalance: number;
  };

  // Risk Metrics
  riskMetrics: {
    portfolioBeta: number;
    portfolioVolatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface Watchlist {
  // Identification
  userId: string;
  timestamp: Date | string;

  // Items
  items: {
    [ticker: string]: {
      addedAt: Date | string;
      reason: string;
      notes?: string;
      alertPrice?: number;
      alertDirection?: 'above' | 'below';
    };
  };

  // Summary
  summary: {
    totalItems: number;
    categories: string[];
  };
}

export interface UserPreference {
  // Identification
  userId: string;
  timestamp: Date | string;

  // Risk Tolerance
  riskTolerance: {
    level: 'conservative' | 'moderate' | 'aggressive';
    maxDrawdown: number;      // %
    maxPositionSize: number;   // %
  };

  // Investment Style
  investmentStyle: {
    horizon: 'short' | 'medium' | 'long';
    approach: 'value' | 'growth' | 'technical' | 'balanced';
    tradingFrequency: 'low' | 'medium' | 'high';
  };

  // Return Expectations
  returnExpectations: {
    targetReturn: number;      // %
    minAcceptableReturn: number; // %
  };

  // Trading Preferences
  tradingPreferences: {
    useStopLoss: boolean;
    useTakeProfit: boolean;
    dayTradingEnabled: boolean;
    optionsTradingEnabled: boolean;
  };

  // Notification Preferences
  notificationPreferences: {
    tradeAlerts: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
    reviewAlerts: boolean;
  };
}
