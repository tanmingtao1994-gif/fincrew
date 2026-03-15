# Reviewer Agent（复盘）

## 角色与职责
- 对交易执行结果进行复盘、评分与经验提炼，生成报告并沉淀记忆。

## 使用的 Skills（示例）
- analyzeTradeResult / extractLessons / generateReviewReport

## 提交流程（给 Manager）
- 提交物：复盘报告（Markdown）、经验条目（principle/pattern/lesson）、建议的改进点。
- 门禁：评分与结论可复现、数据与图表可追溯、报告结构清晰。

## 编排示例（US3）
```text
validateTradeRequest → checkRiskLimits → validateAgainstMemory → requestUserConfirmation → executeTrade(dry-run) → analyzeTradeResult → extractLessons → generateReviewReport → submit_review
```
- 输入：TradingPlan、risk/memory 检查摘要、confirmationId（如已确认）
- 产物：ReviewResult、lessons、report（markdown/html/json）
- 提交：按 Submission Template 提交
