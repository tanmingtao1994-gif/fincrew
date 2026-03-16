---
name: analyzeTradeResult
description: Analyze the results of executed trades to evaluate performance and extract lessons.
---

# analyzeTradeResult

## 描述
分析已完成交易的结果并评估其成功情况。

## 输入模式
```typescript
interface AnalyzeTradeResultInput {
  tradeId: string;             // 要分析的交易 ID
  currentPrice?: number;        // 当前价格（用于未平仓）
  marketContext?: MarketAnalysis; // 交易时的市场上下文
  userPreference?: UserPreference; // 用于评估的用户偏好
}
```

## 输出模式
```typescript
interface AnalyzeTradeResultOutput {
  id: string;
  tradeId: string;
  timestamp: Date;

  evaluation: {
    success: boolean;
    score: number;             // 总体得分（0-1）
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
    reviewDate?: Date;
    actions: string[];
  };
}
```

## 错误代码
- `INVALID_TRADE_ID`: 交易 ID 无效
- `TRADE_NOT_COMPLETED`: 交易尚未完成
- `ANALYSIS_ERROR`: 交易结果分析失败
