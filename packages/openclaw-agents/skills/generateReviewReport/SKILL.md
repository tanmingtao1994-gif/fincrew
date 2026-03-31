---
name: generateReviewReport
description: Generate a comprehensive review report for a trade, including performance analysis, lessons learned, and recommendations.
---

# generateReviewReport

## 描述
为交易生成综合审查报告。

## 输入模式
```typescript
interface GenerateReviewReportInput {
  tradeId: string;             // 要生成报告的交易 ID
  reviewResult: ReviewResult; // 审查结果
  includeCharts?: boolean;   // 是否包含图表（默认：false）
  format?: 'markdown' | 'html' | 'json'; // 输出格式（默认：'markdown'）
}
```

## 输出模式
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

## 错误代码
- `INVALID_TRADE_ID`: 交易 ID 无效
- `INVALID_FORMAT`: 输出格式不支持
- `REPORT_GENERATION_ERROR`: 报告生成失败
