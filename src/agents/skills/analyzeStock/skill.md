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
