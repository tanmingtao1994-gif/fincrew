---
name: collect
description: Collect market data, technical indicators, news, KOL views, and option data for financial analysis.
---

# collect

## 描述
提供市场数据收集工具，包括获取股票价格、技术指标、新闻、KOL 观点和期权数据。

## 使用方法
此 skill 通过直接调用项目根目录下的 npm script 来执行底层的数据采集和分析工具。需要预先执行 `npm run build` 进行编译。
**重要：执行任何 npm script 前，必须先通过 cd 命令切换到项目的绝对路径下（例如：`cd /Users/bytedance/projects/ai/financial-agent`），然后再执行相应的 npm run 命令。**

### 示例命令
```bash
# 进入项目绝对根目录
cd /Users/bytedance/projects/ai/financial-agent

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
读取位于项目绝对路径下的数据文件。具体固定为读取 `/Users/bytedance/projects/ai/financial-agent/data/daily/<date>/<filename>.json`。
因为 script 脚本将采集的数据保存在这个位置，Agent 可以通过这个 Action 并指定日期和文件名提取采集到的原始 JSON 数据供进一步分析。

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
