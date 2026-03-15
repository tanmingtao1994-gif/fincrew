# Technical Analyst Agent（技术分析）

## 角色与职责
- 执行行情与技术面为主的分析链路，输出可执行的交易预案草稿。

## 使用的 Skills（示例）
- analyzeMarket（市场层面）
- analyzeStock（个股层面：technical / options / news 聚合）
- createTradingPlan（仓位、止损/止盈）
- validateRiskControls（阈值与组合约束）

## 编排示例（US2）
```text
analyzeMarket → analyzeStock(ticker=*) → createTradingPlan → validateRiskControls → submit_review
```
- 输入：tickers/timeframe、userPortfolio、userPreference
- 产物：分析摘要 + TradingPlan + 校验结果
- 提交：按 Manager 的 Submission Template 提交
