# extractLessons

## 描述
从交易审查中提取经验教训，并将其格式化用于记忆存储。

## 输入模式
```typescript
interface ExtractLessonsInput {
  reviewResult: ReviewResult; // 要提取教训的审查结果
  tradeRecord: TradeRecord;   // 原始交易记录
  marketContext?: MarketAnalysis; // 市场上下文
}
```

## 输出模式
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

## 错误代码
- `INVALID_INPUT`: 输入参数无效
- `EXTRACTION_ERROR`: 提取教训失败
