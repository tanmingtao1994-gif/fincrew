# Review Tools Contract

**Version**: 1.0.0
**Status**: Draft
**Date**: 2026-03-12

## 概述

本文档定义了审查工具的 API 合约，这些工具提供了交易审查、分析和学习的原子操作。

---

## Tool: analyzeTradeResult

### 描述

分析已完成交易的结果并评估其成功情况。

### 输入模式

```typescript
interface AnalyzeTradeResultInput {
  tradeId: string;             // 要分析的交易 ID
  currentPrice?: number;        // 当前价格（用于未平仓）
  marketContext?: MarketAnalysis; // 交易时的市场上下文
  userPreference?: UserPreference; // 用于评估的用户偏好
}
```

### 输出模式

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

### 错误代码

- `INVALID_TRADE_ID`: 交易 ID 无效
- `TRADE_NOT_COMPLETED`: 交易尚未完成
- `ANALYSIS_ERROR`: 交易结果分析失败

### 示例

```typescript
const result = await analyzeTradeResult({
  tradeId: 'trade-001',
  currentPrice: 185.50,
  marketContext: marketAnalysis
});

// 输出:
// {
//   id: 'review-001',
//   tradeId: 'trade-001',
//   timestamp: new Date('2026-03-12T10:30:00Z'),
//   evaluation: {
//     success: true,
//     score: 0.85,
//     grade: 'A'
//   },
//   analysis: {
//     decisionQuality: {
//       score: 0.9,
//       reasoning: 'Strong fundamental analysis, good timing'
//     },
//     executionQuality: {
//       score: 0.85,
//       reasoning: 'Good execution at limit price'
//     },
//     timing: {
//       score: 0.8,
//       reasoning: 'Entered near local low, good entry timing'
//     }
//   },
//   lessons: {
//     whatWentWell: [
//       'Correctly identified bullish trend',
//       'Proper risk management with stop-loss'
//     ],
//     whatWentWrong: [
//       'Could have entered slightly earlier'
//     ],
//     improvements: [
//       'Consider adding position in tranches',
//       'Monitor for earlier entry signals'
//     ]
//   },
//   memoryUpdates: {
//     principles: [],
//     patterns: ['Strong earnings = positive momentum'],
//     lessons: ['AAPL responds well to earnings beats']
//   },
//   followUp: {
//     needsReview: false,
//     actions: []
//   }
// }
```

---

## Tool: extractLessons

### 描述

从交易审查中提取经验教训，并将其格式化用于记忆存储。

### 输入模式

```typescript
interface ExtractLessonsInput {
  reviewResult: ReviewResult; // 要提取教训的审查结果
  tradeRecord: TradeRecord;   // 原始交易记录
  marketContext?: MarketAnalysis; // 市场上下文
}
```

### 输出模式

```typescript
interface ExtractLessonsOutput {
  lessons: Array<{
    type: 'principle' | 'pattern' | 'lesson';
    title: string;
    content: string;
    confidence: number;
    weight: number;
    relatedTickers: string[];
    tags: string[];
  }>;
  summary: {
    totalLessons: number;
    byType: {
      principle: number;
      pattern: number;
      lesson: number;
    };
  };
}
```

### 错误代码

- `INVALID_INPUT`: 输入参数无效
- `EXTRACTION_ERROR`: 提取教训失败

### 示例

```typescript
const result = await extractLessons({
  reviewResult: reviewResult,
  tradeRecord: tradeRecord,
  marketContext: marketAnalysis
});

// 输出:
// {
//   lessons: [
//     {
//       type: 'pattern',
//       title: 'Earnings beat pattern',
//       content: 'When AAPL beats earnings estimates, stock typically rallies 3-5%',
//       confidence: 0.85,
//       weight: 0.8,
//       relatedTickers: ['AAPL'],
//       tags: ['earnings', 'momentum', 'pattern']
//     },
//     {
//       type: 'lesson',
//       title: 'Entry timing improvement',
//       content: 'Consider entering AAPL positions 1-2 days before earnings if trend is bullish',
//       confidence: 0.75,
//       weight: 0.7,
//       relatedTickers: ['AAPL'],
//       tags: ['timing', 'entry', 'earnings']
//     }
//   ],
//   summary: {
//     totalLessons: 2,
//     byType: {
//       principle: 0,
//       pattern: 1,
//       lesson: 1
//     }
//   }
// }
```

---

## Tool: generateReviewReport

### 描述

为交易生成综合审查报告。

### 输入模式

```typescript
interface GenerateReviewReportInput {
  tradeId: string;             // 要生成报告的交易 ID
  reviewResult: ReviewResult; // 审查结果
  includeCharts?: boolean;   // 是否包含图表（默认：false）
  format?: 'markdown' | 'html' | 'json'; // 输出格式（默认：'markdown'）
}
```

### 输出模式

```typescript
interface GenerateReviewReportOutput {
  reportId: string;
  tradeId: string;
  format: string;
  content: string;             // 报告内容
  metadata: {
    generatedAt: Date;
    tradeDate: Date;
    tradeDuration: number;     // 持续天数
    profitLoss: number;
    profitLossPercent: number;
    grade: string;
  };
  charts?: Array<{            // 图表（如 includeCharts 为 true）
    type: string;
    data: any;
    caption: string;
  }>;
}
```

### 错误代码

- `INVALID_TRADE_ID`: 交易 ID 无效
- `INVALID_FORMAT`: 输出格式不支持
- `REPORT_GENERATION_ERROR`: 报告生成失败

### 示例

```typescript
const result = await generateReviewReport({
  tradeId: 'trade-001',
  reviewResult: reviewResult,
  format: 'markdown'
});

// 输出:
// {
//   reportId: 'report-001',
//   tradeId: 'trade-001',
//   format: 'markdown',
//   content: '# Trade Review Report\n\n## Trade Summary\n...',
//   metadata: {
//     generatedAt: new Date('2026-03-12T10:30:00Z'),
//     tradeDate: new Date('2026-03-01T10:00:00Z'),
//     tradeDuration: 11,
//     profitLoss: 700.00,
//     profitLossPercent: 7.85,
//     grade: 'A'
//   }
// }
```

---

## Tool: trackPerformance

### 描述

跟踪和汇总多笔交易的绩效指标。

### 输入模式

```typescript
interface TrackPerformanceInput {
  tradeIds?: string[];         // 要跟踪的特定交易 ID（默认：全部）
  timeframe?: {
    start: Date;
    end: Date;
  };                           // 要分析的时间范围（默认：全部时间）
  groupBy?: 'day' | 'week' | 'month' | 'ticker'; // 分组（默认：无）
}
```

### 输出模式

```typescript
interface TrackPerformanceOutput {
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfitLoss: number;
    averageProfitLoss: number;
    bestTrade: {
      tradeId: string;
      profitLoss: number;
      profitLossPercent: number;
    };
    worstTrade: {
      tradeId: string;
      profitLoss: number;
      profitLossPercent: number;
    };
  };
  metrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;      // 平均盈利 / 平均亏损
  };
  byGroup?: {                // 按组别的绩效（如指定了 groupBy）
    [groupKey: string]: {
      trades: number;
      winRate: number;
      totalProfitLoss: number;
    };
  };
  trends: {
    profitTrend: 'improving' | 'stable' | 'declining';
    winRateTrend: 'improving' | 'stable' | 'declining';
  };
}
```

### 错误代码

- `INVALID_TIMEFRAME`: 时间范围无效
- `NO_TRADES_FOUND`: 未找到符合条件的交易
- `PERFORMANCE_ERROR`: 绩效跟踪失败

### 示例

```typescript
const result = await trackPerformance({
  timeframe: {
    start: new Date('2026-01-01'),
    end: new Date('2026-03-12')
  },
  groupBy: 'ticker'
});

// 输出:
// {
//   summary: {
//     totalTrades: 25,
//     winningTrades: 18,
//     losingTrades: 7,
//     winRate: 0.72,
//     totalProfitLoss: 5230.00,
//     averageProfitLoss: 209.20,
//     bestTrade: {
//       tradeId: 'trade-015',
//       profitLoss: 850.00,
//       profitLossPercent: 12.5
//     },
//     worstTrade: {
//       tradeId: 'trade-008',
//       profitLoss: -320.00,
//       profitLossPercent: -4.2
//     }
//   },
//   metrics: {
//     sharpeRatio: 1.85,
//     maxDrawdown: -8.5,
//     averageWin: 350.00,
//     averageLoss: -180.00,
//     profitFactor: 1.94
//   },
//   byGroup: {
//     'AAPL': {
//       trades: 10,
//       winRate: 0.8,
//       totalProfitLoss: 2100.00
//     },
//     'MSFT': {
//       trades: 8,
//       winRate: 0.75,
//       totalProfitLoss: 1850.00
//     },
//     'GOOG': {
//       trades: 7,
//       winRate: 0.57,
//       totalProfitLoss: 1280.00
//     }
//   },
//   trends: {
//     profitTrend: 'improving',
//     winRateTrend: 'stable'
//   }
// }
```

---

## Tool: scheduleFollowUpReview

### 描述

为交易安排后续审查，在未来某个日期进行。

### 输入模式

```typescript
interface ScheduleFollowUpReviewInput {
  tradeId: string;             // 要安排审查的交易 ID
  reviewDate: Date;           // 后续审查日期
  reason?: string;            // 后续审查原因
  conditions?: string[];       // 触发提前审查的条件
}
```

### 输出模式

```typescript
interface ScheduleFollowUpReviewOutput {
  scheduled: boolean;
  reviewId: string;
  tradeId: string;
  reviewDate: Date;
  reason: string;
  conditions: string[];
  createdAt: Date;
}
```

### 错误代码

- `INVALID_TRADE_ID`: 交易 ID 无效
- `INVALID_DATE`: 审查日期在过去
- `SCHEDULING_ERROR`: 后续审查安排失败

### 示例

```typescript
const result = await scheduleFollowUpReview({
  tradeId: 'trade-001',
  reviewDate: new Date('2026-04-01'),
  reason: 'Check if target price is reached',
  conditions: ['Price reaches $195', 'Price drops below $170']
});

// 输出:
// {
//   scheduled: true,
//   reviewId: 'followup-001',
//   tradeId: 'trade-001',
//   reviewDate: new Date('2026-04-01T00:00:00Z'),
//   reason: 'Check if target price is reached',
//   conditions: [
//     'Price reaches $195',
//     'Price drops below $170'
//   ],
//   createdAt: new Date('2026-03-12T10:30:00Z')
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
