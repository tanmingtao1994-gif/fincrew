# analyzeTradeResult.skill

> 中文为主；英文专名与命令保留。

## 目标
- 对已执行的交易进行复盘评分，输出多维度分析与改进要点。

## 输入
- tradeRecord: JSON
- marketContext?: JSON（可选）
- userPreference?: JSON（可选）

## 输出
- ReviewResult（evaluation/analysis/lessons/memoryUpdates/followUp）。

## 步骤（示例）
```bash
# TODO：接入复盘脚本
# node ./scripts/review/analyze-trade.js --trade ./output/AAPL-trade.json --out ./output/AAPL-review.json
```

## 审核
- 提交：ReviewResult 与摘要；数据与结论可追溯。
