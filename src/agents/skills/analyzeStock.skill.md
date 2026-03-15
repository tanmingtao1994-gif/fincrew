# analyzeStock.skill

> 中文为主；英文专名与命令保留。

## 目标
- 针对单一标的，整合技术面（technical）、期权（options）、新闻/KOL（sentiment）信号，输出分析结论与置信度。

## 输入
- ticker: string（必填）
- timeframe: '1d' | '1wk' | '1mo'（默认 '1d'）

## 输出
- StockAnalysis（JSON/Markdown）：包含 conclusion、confidence、assessment、risk、recommendation、rationale。

## 步骤（示例）
```bash
# 1) 收集该标的必要数据
node ./stock_rich/dist/index.js collect --ticker ${TICKER} --range 1d
node ./stock_rich/dist/index.js options --ticker ${TICKER} --date 2026-03-20
node ./stock_rich/dist/index.js news --ticker ${TICKER} --days 3

# 2) 聚合与打分（TODO：接入实际脚本）
# node ./scripts/analyze/stock.js --ticker ${TICKER} --timeframe 1d --out ./output/${TICKER}-analysis.json
```

## 门禁（Gates）
- 输出包含 conclusion、confidence 与 assessment（fundamental/technical/sentiment）要素。
- 给出 risk（level/factors/stopLoss）与 recommendation（action/entry/target/positionSize）。

## 审核
- 提交：分析摘要 + 产物路径 + 命令记录。
- 回收：按建议补充缺失维度或修正参数。
