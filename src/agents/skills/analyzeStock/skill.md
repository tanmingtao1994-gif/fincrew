---
name: analyzeStock
description: Analyze individual stocks, providing technical, fundamental, and sentiment analysis along with trading recommendations.
---

# analyzeStock

## 描述
分析个股并提供投资建议。

## 输入模式
```typescript
interface AnalyzeStockInput {
  ticker: string;              // 股票代码
  timeframe?: string;           // 分析时间周期（默认："1d"）
  includeMemory?: boolean;     // 使用历史记忆（默认：true）
  userPreference?: UserPreference; // 用于定制的用户偏好
}
```

## 输出模式
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

## 错误代码
- `INVALID_TICKER`: 股票代码格式无效
- `NO_DATA`: 无股票数据可用
- `ANALYSIS_ERROR`: 股票分析失败

## Implementation Details

### Steps (Example)
```bash
# 1) Collect necessary data for the ticker
node /Users/bytedance/projects/ai/financial-agent/src/stock_rich/dist/index.js collect --ticker ${TICKER} --range 1d
node /Users/bytedance/projects/ai/financial-agent/src/stock_rich/dist/index.js options --ticker ${TICKER} --date 2026-03-20
node /Users/bytedance/projects/ai/financial-agent/src/stock_rich/dist/index.js news --ticker ${TICKER} --days 3

# 2) Aggregation and Scoring (TODO: Integrate actual script)
# node /Users/bytedance/projects/ai/financial-agent/scripts/analyze/stock.js --ticker ${TICKER} --timeframe 1d --out ./output/${TICKER}-analysis.json
```

### Gates
- Output must include `conclusion`, `confidence`, and `assessment` (fundamental/technical/sentiment).
- Must provide `risk` (level/factors/stopLoss) and `recommendation` (action/entry/target/positionSize).
