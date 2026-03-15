# collect.skill

> 语言规范：中文为主，英文专有名词保留。以下示例用于演示如何通过 Node 调用 stock_rich 收集数据。

## 目标
- 统一触发行情、技术指标、期权、新闻/KOL 收集流水线，供后续分析与决策使用。

## 输入
- tickers: string[]（标的列表，必填）
- range: '1d' | '1wk' | '1mo'（时间范围，默认 '1d'）
- outDir: string（产物目录，默认 ./stock_rich/data）

## 输出
- 缓存文件：./stock_rich/data/cache/**
- 每日快照：./stock_rich/data/daily/YYY-MM-DD/**

## 步骤示例

```bash
# 收集单一标的（示例：AAPL，日线）
node ./stock_rich/dist/index.js collect --ticker AAPL --range 1d

# 批量收集（示例：多标的）
node ./stock_rich/dist/index.js collect --tickers AAPL,MSFT,NVDA --range 1d

# 收集期权链（示例：AAPL 某日期）
node ./stock_rich/dist/index.js options --ticker AAPL --date 2026-03-20

# 收集新闻与 KOL 观点（按 stock_rich 提供命令为准）
node ./stock_rich/dist/index.js news --ticker AAPL --days 3
node ./stock_rich/dist/index.js kol --tickers AAPL,MSFT --days 3
```

## 错误与重试
- RATE_LIMIT_EXCEEDED：指数退避重试（最多 3 次）
- API_ERROR：记录 status 与响应片段，落盘 ./logs/mcp-debug.log 便于追踪

## 审核
- 提交物：本次收集的产物路径与摘要（文件数量、日期范围）
- 自检清单：路径正确、文件数量合理、无 0 字节文件
- 如 Manager 给出 revisions_requested，按建议增补或修正命令参数
