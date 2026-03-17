---
name: collect
description: Collect market data, technical indicators, news, KOL views, and option data for financial analysis.
---

# collect

## 描述
提供市场数据收集工具，包括获取股票价格、技术指标、新闻、KOL 观点和期权数据。

## 使用方法
此 skill 通过直接调用项目根目录下的 npm script 来执行底层的数据采集和分析工具。需要预先执行 `npm run build` 进行编译。

### 示例命令
```bash
# 采集 KOL 数据
npm run collect -- --date 2026-02-19 --platform twitter

# 获取股票数据
npm run data -- --symbols AAPL,TSLA --date 2026-02-19

# 获取期权数据
npm run options -- --symbol NVDA --expiry 2026-02-27 --direction call --date 2026-02-19

# 获取新闻数据
npm run news -- --symbols AAPL --date 2026-02-19
```

## 参数说明

以下是 npm script 支持的所有命令行参数（在执行时如果通过 npm 运行，需要加上 `--` 将参数传递给底层脚本）：

- `--date <YYYY-MM-DD>`: 指定数据采集或查询的日期 (默认为今天)。用于所有命令 (`collect`, `data`, `options`, `news`)。
- `--platform <platform>`: 指定要采集的平台 (仅用于 `collect` 命令)。支持的值: `twitter`, `weibo`, `youtube`。如果不指定，默认采集所有平台。
- `--symbols <SYMBOL1,SYMBOL2>`: 指定股票代码列表，用逗号分隔 (用于 `data`, `news` 命令)。
- `--symbol <SYMBOL>`: 指定单只股票代码 (用于 `options` 命令)。
- `--expiry <YYYY-MM-DD>`: 期权到期日 (用于 `options` 命令)。
- `--direction <call|put>`: 期权方向，看涨或看跌 (用于 `options` 命令)。

## Actions

### readDailyData
读取 `data/daily/<date>` 目录下保存的各类采集结果数据文件（如 `posts.json`、`stockdata.json` 等）。因为 script 脚本将采集的数据保存在这个位置，Agent 可以通过这个 Action 提取采集到的原始 JSON 数据供进一步分析。

#### 输入
```typescript
interface ReadDailyDataInput {
  date: string;                // 目标日期，格式为 YYYY-MM-DD
  filename: string;            // 文件名，不需要 .json 后缀（例如 "posts" 或 "stockdata"）
}
```

#### 输出
```typescript
// 返回解析后的 JSON 对象。结构取决于具体请求的文件。
// 如果文件不存在，则返回 null。
type ReadDailyDataOutput = Record<string, any> | any[] | null;
```

### getStockPrice
获取指定股票代码的当前股票价格和基本市场数据。

#### 输入
```typescript
interface GetStockPriceInput {
  ticker: string;              // 股票代码（例如 "AAPL", "0700.HK"）
  includePreMarket?: boolean;   // 是否包含盘前价格（默认：false）
}
```

#### 输出
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

### getTechnicalIndicator
获取指定股票代码和时间周期的技术分析指标。

#### 输入
```typescript
interface GetTechnicalIndicatorInput {
  ticker: string;              // 股票代码
  indicator: string;           // 指标类型（例如 "MA", "RSI", "MACD"）
  timeframe: string;           // 时间周期（例如 "1d", "1wk", "1mo"）
  params?: Record<string, any>;  // 指标特定参数
}
```

#### 输出
```typescript
interface GetTechnicalIndicatorOutput {
  ticker: string;              // 股票代码
  indicator: string;           // 指标类型
  timeframe: string;           // 时间周期
  values: Record<string, number>; // 指标值
  timestamp: Date;             // 数据时间戳
}
```

### collectNews
从多个来源收集与指定股票代码相关的新闻文章。

#### 输入
```typescript
interface CollectNewsInput {
  ticker: string;              // 股票代码
  sources?: string[];          // 新闻来源（默认：所有来源）
  limit?: number;              // 最大文章数（默认：10）
  days?: number;               // 回溯天数（默认：7）
}
```

#### 输出
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

### collectKOLViews
从社交媒体平台收集关键意见领袖（KOL）的观点和建议。

#### 输入
```typescript
interface CollectKOLViewsInput {
  tickers?: string[];          // 要过滤的股票代码（默认：全部）
  platforms?: string[];        // 平台（默认：全部）
  limit?: number;              // 最大观点数（默认：20）
  days?: number;               // 回溯天数（默认：7）
}
```

#### 输出
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

### getOptionData
获取指定股票代码的期权数据，包括定价和 Greeks。

#### 输入
```typescript
interface GetOptionDataInput {
  ticker: string;              // 股票代码
  expirationDate?: Date;       // 特定到期日（默认：全部）
  strikePrice?: number;        // 特定行权价（默认：全部）
  type?: 'call' | 'put';     // 期权类型（默认：全部）
}
```

#### 输出
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

## 错误代码
- `INVALID_TICKER`: 股票代码格式无效
- `API_ERROR`: 从 API 获取数据失败
- `RATE_LIMIT_EXCEEDED`: API 速率限制超出
- `INVALID_INDICATOR`: 指标类型不支持
- `INVALID_TIMEFRAME`: 时间周期不支持
- `NO_ARTICLES_FOUND`: 未找到符合条件的文章
- `INVALID_PLATFORM`: 平台不支持
- `NO_VIEWS_FOUND`: 未找到符合条件的观点
- `NO_OPTIONS_FOUND`: 未找到符合条件的期权
