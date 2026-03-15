# Market Data Tools Contract

**Version**: 1.0.0
**Status**: Draft
**Date**: 2026-03-12

## 概述

本文档定义了市场数据工具的 API 合约，这些工具提供了从 stock_rich 模块获取股票数据、技术指标、新闻、KOL 观点和期权数据的原子操作。

---

## Tool: getStockPrice

### 描述

获取指定股票代码的当前股票价格和基本市场数据。

### 输入模式

```typescript
interface GetStockPriceInput {
  ticker: string;              // 股票代码（例如 "AAPL", "0700.HK"）
  includePreMarket?: boolean;   // 是否包含盘前价格（默认：false）
}
```

### 输出模式

```typescript
interface GetStockPriceOutput {
  price: number;               // 当前价格
  change: number;              // 价格变化
  changePercent: number;        // 价格变化百分比
  volume: number;             // 交易量
  marketCap: number;           // 市值
  timestamp: Date;             // 数据时间戳
  source: string;              // 数据源
}
```

### 错误代码

- `INVALID_TICKER`: 股票代码格式无效
- `API_ERROR`: 从 API 获取数据失败
- `RATE_LIMIT_EXCEEDED`: API 速率限制超出

### 示例

```typescript
const result = await getStockPrice({
  ticker: 'AAPL',
  includePreMarket: true
});

// 输出:
// {
//   price: 178.52,
//   change: 2.35,
//   changePercent: 1.33,
//   volume: 52340000,
//   marketCap: 2780000000000,
//   timestamp: new Date('2026-03-12T10:30:00Z'),
//   source: 'Yahoo Finance'
// }
```

---

## Tool: getTechnicalIndicator

### 描述

获取指定股票代码和时间周期的技术分析指标。

### 输入模式

```typescript
interface GetTechnicalIndicatorInput {
  ticker: string;              // 股票代码
  indicator: string;           // 指标类型（例如 "MA", "RSI", "MACD"）
  timeframe: string;           // 时间周期（例如 "1d", "1wk", "1mo"）
  params?: Record<string, any>;  // 指标特定参数
}
```

### 输出模式

```typescript
interface GetTechnicalIndicatorOutput {
  ticker: string;              // 股票代码
  indicator: string;           // 指标类型
  timeframe: string;           // 时间周期
  values: Record<string, number>; // 指标值
  timestamp: Date;             // 数据时间戳
}
```

### 错误代码

- `INVALID_TICKER`: 股票代码格式无效
- `INVALID_INDICATOR`: 指标类型不支持
- `INVALID_TIMEFRAME`: 时间周期不支持
- `API_ERROR`: 从 API 获取数据失败

### 示例

```typescript
const result = await getTechnicalIndicator({
  ticker: 'AAPL',
  indicator: 'MA',
  timeframe: '1d',
  params: { periods: [20, 50] }
});

// 输出:
// {
//   ticker: 'AAPL',
//   indicator: 'MA',
//   timeframe: '1d',
//   values: { MA20: 175.32, MA50: 172.15 },
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: collectNews

### 描述

从多个来源收集与指定股票代码相关的新闻文章。

### 输入模式

```typescript
interface CollectNewsInput {
  ticker: string;              // 股票代码
  sources?: string[];          // 新闻来源（默认：所有来源）
  limit?: number;              // 最大文章数（默认：10）
  days?: number;               // 回溯天数（默认：7）
}
```

### 输出模式

```typescript
interface CollectNewsOutput {
  articles: Array<{
    id: string;
    title: string;
    content: string;
    url: string;
    source: string;
    category: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    publishedAt: Date;
  }>;
  total: number;               // 找到的文章总数
  timestamp: Date;             // 收集时间戳
}
```

### 错误代码

- `INVALID_TICKER`: 股票代码格式无效
- `API_ERROR`: 从 API 获取新闻失败
- `NO_ARTICLES_FOUND`: 未找到符合条件的文章

### 示例

```typescript
const result = await collectNews({
  ticker: 'AAPL',
  sources: ['Reuters', 'Bloomberg'],
  limit: 5
});

// 输出:
// {
//   articles: [
//     {
//       id: 'news-001',
//       title: 'Apple Reports Strong Q4 Earnings',
//       content: 'Apple Inc. reported...',
//       url: 'https://reuters.com/...',
//       source: 'Reuters',
//       category: 'Earnings',
//       sentiment: 'positive',
//       publishedAt: new Date('2026-03-11T08:00:00Z')
//     },
//     // ... 更多文章
//   ],
//   total: 5,
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: collectKOLViews

### 描述

从社交媒体平台收集关键意见领袖（KOL）的观点和建议。

### 输入模式

```typescript
interface CollectKOLViewsInput {
  tickers?: string[];          // 要过滤的股票代码（默认：全部）
  platforms?: string[];        // 平台（默认：全部）
  limit?: number;              // 最大观点数（默认：20）
  days?: number;               // 回溯天数（默认：7）
}
```

### 输出模式

```typescript
interface CollectKOLViewsOutput {
  views: Array<{
    id: string;
    kolName: string;
    kolHandle: string;
    platform: string;
    content: string;
    type: 'recommendation' | 'analysis' | 'prediction';
    recommendedTickers: string[];
    action: 'buy' | 'sell' | 'hold' | 'watch';
    confidence: number;
    postedAt: Date;
  }>;
  total: number;               // 找到的观点总数
  timestamp: Date;             // 收集时间戳
}
```

### 错误代码

- `INVALID_PLATFORM`: 平台不支持
- `API_ERROR`: 从 API 获取 KOL 观点失败
- `NO_VIEWS_FOUND`: 未找到符合条件的观点

### 示例

```typescript
const result = await collectKOLViews({
  tickers: ['AAPL', 'MSFT'],
  platforms: ['Twitter'],
  limit: 10
});

// 输出:
// {
//   views: [
//     {
//       id: 'kol-001',
//       kolName: 'Tech Trader',
//       kolHandle: '@tech_trader',
//       platform: 'Twitter',
//       content: 'AAPL showing strong momentum...',
//       type: 'recommendation',
//       recommendedTickers: ['AAPL'],
//       action: 'buy',
//       confidence: 0.8,
//       postedAt: new Date('2026-03-11T12:00:00Z')
//     },
//     // ... 更多观点
//   ],
//   total: 10,
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: getOptionData

### 描述

获取指定股票代码的期权数据，包括定价和 Greeks。

### 输入模式

```typescript
interface GetOptionDataInput {
  ticker: string;              // 股票代码
  expirationDate?: Date;       // 特定到期日（默认：全部）
  strikePrice?: number;        // 特定行权价（默认：全部）
  type?: 'call' | 'put';     // 期权类型（默认：全部）
}
```

### 输出模式

```typescript
interface GetOptionDataOutput {
  ticker: string;              // 股票代码
  options: Array<{
    contractSymbol: string;
    type: 'call' | 'put';
    strikePrice: number;
    expirationDate: Date;
    daysToExpiration: number;
    bid: number;
    ask: number;
    lastPrice: number;
    impliedVolatility: number;
    greeks: {
      delta: number;
      gamma: number;
      theta: number;
      vega: number;
      rho: number;
    };
    ivr: number;
                ivRvSpread: number;
  }>;
  maxPain: number;            // 最大痛点价格
  timestamp: Date;             // 数据时间戳
}
```

### 错误代码

- `INVALID_TICKER`: 股票代码格式无效
- `API_ERROR`: 从 API 获取期权数据失败
- `NO_OPTIONS_FOUND`: 未找到符合条件的期权

### 示例

```typescript
const result = await getOptionData({
  ticker: 'AAPL',
  expirationDate: new Date('2026-03-20'),
  type: 'call'
});

// 输出:
// {
//   ticker: 'AAPL',
//   options: [
//     {
//       contractSymbol: 'AAPL260320C00175000',
//       type: 'call',
//       strikePrice: 175,
//       expirationDate: new Date('2026-03-20'),
//       daysToExpiration: 8,
//       bid: 4.20,
//       ask: 4.35,
//       lastPrice: 4.28,
//       impliedVolatility: 28.5,
//       greeks: {
//         delta: 0.52,
//         gamma: 0.08,
//         theta: -0.15,
//         vega: 0.12,
//         rho: 0.05
//       },
//       ivr: 65.3,
//       ivRvSpread: 8.2
//     },
//     // ... 更多期权
//   ],
//   maxPain: 172.50,
//   timestamp: new Date('2026-03-12T10:30:00Z')
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
    code: string;              // 错误代码
    message: string;           // 错误消息
    details?: Record<string, any>; // 额外错误详情
  };
  timestamp: Date;
}
```

---

## 版本历史

| Version | Date | Changes |
|---------|-------|----------|
| 1.0.0 | 2026-03-12 | 初始版本 |
