# US3 验收清单（Trade Execution & Review）

> 中文为主，英文专名保留；按清单逐项自检。

## 产物
- [ ] 校验结果：validateTradeRequest（valid/checks/warnings/errors）。
- [ ] 风控结果：checkRiskLimits（positionSize/stopLoss/dailyLoss/concentration）。
- [ ] 记忆一致性结果：validateAgainstMemory（compliant/principles/violations/suggestions）。
- [ ] 用户确认：requestUserConfirmation（confirmed/confirmationId/details）。
- [ ] 执行记录：executeTrade（dry-run 优先，TradeRecord）。
- [ ] 回滚记录（如需）：rollbackTrade（rollbackDetails）。
- [ ] 复盘结果：analyzeTradeResult（ReviewResult）。
- [ ] 经验条目：extractLessons（principle/pattern/lesson）。
- [ ] 报告：generateReviewReport（markdown/html/json）。

## 可追溯性
- [ ] 所有结论附命令记录与数据来源；文件路径与时间范围明确。

## 门禁
- [ ] 未确认（confirmed=false）不得执行真实交易；dry-run 优先。
- [ ] 风控/记忆不通过须调整参数并复核。

## 提交
- [ ] 按 Submission Template 提交给 Manager；如被 revisions_requested，完成回收与再次提交。
