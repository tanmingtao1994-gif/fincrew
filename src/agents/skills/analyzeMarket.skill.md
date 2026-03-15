# analyzeMarket.skill

> 中文为主，英文专名保留；命令与路径使用英文。

## 目标
- 生成市场层面的分析摘要：情绪（sentiment）、板块强弱（sectors）、热点（hotTopics/hotStocks）、风险等级（riskLevel）。

## 输入
- timeframe: '1d' | '1wk' | '1mo'（默认 '1d'）
- tickers?: string[]（可选，聚焦范围）

## 输出
- 市场分析摘要（JSON/Markdown），供 Technical Analyst 与 Manager 使用。

## 步骤（示例）
```bash
# 1) 收集基础数据（按需替换命令，参考 collect.skill）
node ./stock_rich/dist/index.js collect --tickers AAPL,MSFT,NVDA --range 1d

# 2) 收集新闻与 KOL（按需）
node ./stock_rich/dist/index.js news --ticker AAPL --days 3
node ./stock_rich/dist/index.js kol --tickers AAPL,MSFT --days 3

# 3) 聚合与计算（TODO：接入实际分析脚本/命令）
# node ./scripts/analyze/market.js --timeframe 1d --out ./output/market-1d.json
```

## 门禁（Gates）
- 输出包含 sentiment/score、sectors、hotTopics/hotStocks、riskLevel 与 riskFactors。
- 结论可追溯（标注数据来源/命令）。

## 审核
- 提交：分析摘要（路径与关键指标）+ 命令记录。
- 回收：按 Manager 建议补充缺失因子或说明。
