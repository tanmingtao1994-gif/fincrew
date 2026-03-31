# US2 验收清单（Decision Analysis & Planning）

> 语言：中文为主，英文专名保留；按清单逐项自检。

## 产物
- [ ] 输出市场分析摘要（sentiment/sectors/hotTopics/hotStocks/riskLevel）。
- [ ] 输出个股分析（conclusion/confidence/assessment/risk/recommendation/rationale）。
- [ ] 生成 TradingPlan（execution/riskControls/reasoning/statusHistory）。
- [ ] 风控校验结果（positionSizeCheck/stopLossCheck/dailyLossCheck/concentrationCheck）。

## 可追溯性
- [ ] 所有结论附数据来源/命令记录（collect/news/options 等）。
- [ ] 文件路径与时间范围明确，便于复现。

## 门禁
- [ ] positionSize 满足 userPreference 与 userPortfolio 约束。
- [ ] 设置明确 stopLoss / takeProfit / maxLoss。
- [ ] 给出 memoryIds（如使用记忆）。

## 提交
- [ ] 按 Submission Template 提交给 Manager（包含摘要、产物路径、命令记录）。
- [ ] 如被 revisions_requested，完成回收并再次提交。
