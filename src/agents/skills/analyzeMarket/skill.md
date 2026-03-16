# analyzeMarket

## 描述
分析整体市场情感、板块趋势，并识别热门话题和股票。

## 输入模式
```typescript
interface AnalyzeMarketInput {
  tickers?: string[];          // 要分析的特定股票代码（默认：所有观察列表）
  timeframe?: string;           // 分析时间周期（默认："1d"）
  includeNews?: boolean;        // 在分析中包含新闻（默认：true）
  includeKOL?: boolean;        // 在分析中包含 KOL 观点（默认：true）
}
```

## 输出模式
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

## 错误代码
- `NO_DATA`: 无市场数据可用
- `ANALYSIS_ERROR`: 市场分析失败
- `INVALID_TIMEFRAME`: 时间周期不支持
