# Decision Making Tools Contract

**Version**: 1.0.0
**Status**: Draft
**Date**: 2026-03-12

## 概述

本文档定义了决策工具的 API 合约，这些工具提供了市场分析、股票分析和交易计划生成的原子操作。

---

## Tool: analyzeMarket

### 描述

分析整体市场情感、板块趋势，并识别热门话题和股票。

### 输入模式

```typescript
interface AnalyzeMarketInput {
  tickers?: string[];          // 要分析的特定股票代码（默认：所有观察列表）
  timeframe?: string;           // 分析时间周期（默认："1d"）
  includeNews?: boolean;        // 在分析中包含新闻（默认：true）
  includeKOL?: boolean;        // 在分析中包含 KOL 观点（默认：true）
}
```

### 输出模式

```typescript
interface AnalyzeMarketOutput {
  id: string;                 // 唯一分析 ID
  timestamp: Date;             // 分析时间戳

  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;             // 情感得分（-1 到 1）
    factors: {
      news: number;
      social: number;
      technical: number;
    };
  };

  sectors: {
    [sectorName: string]: {
      trend: 'up' | 'down' | 'sideways';
      strength: number;
      topStocks: string[];
    };
  };

  hotTopics: string[];
  hotStocks: string[];

  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}
```

### 错误代码

- `NO_DATA`: 无市场数据可用
- `ANALYSIS_ERROR`: 市场分析失败
- `INVALID_TIMEFRAME`: 时间周期不支持

### 示例

```typescript
const result = await analyzeMarket({
  tickers: ['AAPL', 'MSFT', 'GOOG'],
  timeframe: '1d'
});

// 输出:
// {
//   id: 'analysis-001',
//   timestamp: new Date('2026-03-12T10:30:00Z'),
//   sentiment: {
//     overall: 'bullish',
//     score: 0.65,
//     factors: {
//       news: 0.7,
//       social: 0.6,
//       technical: 0.65
//     }
//   },
//   sectors: {
//     'Technology': {
//       trend: 'up',
//       strength: 0.8,
//       topStocks: ['AAPL', 'MSFT', 'NVDA']
//     }
//   },
//   hotTopics: ['AI', 'Cloud Computing', 'Semiconductors'],
//   hotStocks: ['NVDA', 'AMD', 'SMCI'],
//   riskLevel: 'medium',
//   riskFactors: ['High valuation', 'Interest rate sensitivity']
// }
```

---

## Tool: analyzeStock

### 描述

分析个股并提供投资建议。

###### 输入模式

```typescript
interface AnalyzeStockInput {
  ticker: string;              // 股票代码
  timeframe?: string;           // 分析时间周期（默认："1d"）
  includeMemory?: boolean;     // 使用历史记忆（默认：true）
  userPreference?: UserPreference; // 用于定制的用户偏好
}
```

### 输出模式

```typescript
interface AnalyzeStockOutput {
  ticker: string;
  id: string;
  timestamp: Date;

  conclusion: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;

  assessment: {
    fundamental: {
      score: number;
      keyPoints: string[];
    };
    technical: {
      score: number;
      keyPoints: string[];
    };
    sentiment: {
      score: number;
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
    timeHorizon: string;
    positionSize: number;
  };

  rationale: string;
  sources: string[];
}
```

### 错误代码

- `INVALID_TICKER`: 股票代码格式无效
- `NO_DATA`: 无股票数据可用
- `ANALYSIS_ERROR`: 股票分析失败

### 示例

```typescript
const result = await analyzeStock({
  ticker: 'AAPL',
  timeframe: '1d',
  includeMemory: true
});

// 输出:
// {
//   ticker: 'AAPL',
//   id: 'stock-analysis-001',
//   timestamp: new Date('2026-03-12T10:30:00Z'),
//   conclusion: 'buy',
//   confidence: 0.75,
//   assessment: {
//     fundamental: {
//       score: 0.8,
//       keyPoints: ['Strong earnings growth', 'Low P/E ratio']
//     },
//     technical: {
//       score: 0.7,
//       keyPoints: ['Above 50-day MA', 'RSI not overbought']
//     },
//     sentiment: {
//       score: 0.75,
//       keyPoints: ['Positive news sentiment', 'Bullish KOL views']
//     }
//   },
//   risk: {
//     level: 'medium',
//     factors: ['Market volatility', 'Competition risk'],
//     stopLoss: 172.50
//   },
//   recommendation: {
//     action: 'buy',
//     entryPrice: 178.50,
//     targetPrice: 195.00,
//     timeHorizon: '1-3 months',
//     positionSize: 5
//   },
//   rationale: 'AAPL shows strong fundamental and technical indicators...',
//   sources: ['Yahoo Finance', 'Reuters', 'Twitter']
// }
```

---

## Tool: createTradingPlan

### 描述

基于股票分析和风险控制创建详细的交易计划。

### 输入模式

```typescript
interface CreateTradingPlanInput {
  stockAnalysis: StockAnalysis; // 股票分析结果
  userPortfolio: UserPortfolio; // 当前投资组合
  userPreference: UserPreference; // 用户偏好
  memoryIds?: string[];        // 要引用的相关记忆
}
```

### 输出模式

```typescript
interface CreateTradingPlanOutput {
  id: string;
  timestamp: Date;

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
    positionSize: number;
  };

  reasoning: string;
  analysisId: string;
  memoryIds: string[];

  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'user_confirmed';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    reason?: string;
  }>;
}
```

### 错误代码

- `INVALID_ANALYSIS`: 股票分析无效
- `INSUFFICIENT_FUNDS`: 资金不足，无法交易
- `RISK_LIMIT_EXCEEDED`: 交易超出风险限制
- `PRINCIPLE_VIOLATION`: 交易违反投资原则

### 示例

```typescript
const result = await createTradingPlan({
  stockAnalysis: stockAnalysisResult,
  userPortfolio: currentPortfolio,
  userPreference: userPrefs,
  memoryIds: ['mem-001', 'mem-002']
});

// 输出:
// {
//   id: 'trading-plan-001',
//   timestamp: new Date('2026-03-12T10:30:00Z'),
//   ticker: 'AAPL',
//   action: 'buy',
//   execution: {
//     orderType: 'limit',
//     price: 178.50,
//     quantity: 50,
//     timing: 'immediate'
//   },
//   riskControls: {
//     stopLoss: 172.50,
//     takeProfit: 195.00,
//     maxLoss: 300,
//     positionSize: 5
//   },
//   reasoning: 'Based on strong fundamentals and technical indicators...',
//   analysisId: 'stock-analysis-001',
//   memoryIds: ['mem-001', 'mem-002'],
//   status: 'pending',
//   statusHistory: [
//     {
//       status: 'pending',
//       timestamp: new Date('2026-03-12T10:30:00Z')
//     }
//   ]
// }
```

---

## Tool: validateRiskControls

### 描述

根据用户偏好和投资组合约束验证风险控制措施。

### 输入模式

```typescript
interface ValidateRiskControlsInput {
  ticker: string;
  action: 'buy' | 'sell' | 'day_trade';
  proposedQuantity: number;
  proposedPrice: number;
  userPortfolio: UserPortfolio;
  userPreference: UserPreference;
}
```

### 输出模式

```typescript
interface ValidateRiskControlsOutput {
  valid: boolean;
  riskControls: {
    stopLoss: number;
    takeProfit: number;
    maxLoss: number;
    positionSize: number;
  };
  warnings: string[];
  errors: string[];
}
```

### 错误代码

- `INVALID_INPUT`: 输入参数无效
- `VALIDATION_ERROR`: 风险控制验证失败

### 示例

```typescript
const result = await validateRiskControls({
  ticker: 'AAPL',
  action: 'buy',
  proposedQuantity: 50,
  proposedPrice: 178.50,
  userPortfolio: currentPortfolio,
  userPreference: userPrefs
});

// 输出:
// {
//   valid: true,
//   riskControls: {
//     stopLoss: 172.50,
//     takeProfit: 195.00,
//     maxLoss: 300,
//     positionSize: 5
//   },
//   warnings: ['Position size is at maximum limit'],
//   errors: []
// }
```

---

## 通用响应格式

### 成功响应

```typescript
{
  success: true;
  data: <ToolOutput>;
  timestamp: Date;
}
```

### 错误响应

```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: Date;
}
```

---

## 版本历史

| Version | Date | Changes |
|---------|-------|----------|
| 1.0.0 | 2026-03-12 | 初始版本 |
