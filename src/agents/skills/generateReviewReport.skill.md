# generateReviewReport.skill

> 中文为主；英文专名与命令保留。

## 目标
- 生成结构化的复盘报告（Markdown/HTML/JSON），便于归档与沟通。

## 输入
- tradeId: string
- reviewResult: JSON
- format?: 'markdown' | 'html' | 'json'（默认 'markdown'）
- includeCharts?: boolean（默认 false）

## 输出
- 报告产物：reportId、tradeId、format、content、metadata（generatedAt/tradeDate/tradeDuration/profitLoss/profitLossPercent/grade）、charts（可选）。

## 步骤（示例）
```bash
# TODO：接入报告生成脚本
# node ./scripts/review/generate-report.js --trade ./output/AAPL-trade.json --review ./output/AAPL-review.json --format markdown --out ./output/AAPL-report.md
```

## 审核
- 提交：报告内容与元信息；如包含图表，附数据来源。
