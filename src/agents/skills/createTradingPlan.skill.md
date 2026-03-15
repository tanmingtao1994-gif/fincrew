# createTradingPlan.skill

> 中文为主，英文专名保留。

## 目标
- 基于 StockAnalysis 与用户偏好/持仓，生成可执行交易预案：订单类型、价格/数量、止损/止盈、风控边界。

## 输入
- stockAnalysis: JSON（由 analyzeStock.skill 产出）
- userPortfolio: JSON（当前组合快照）
- userPreference: JSON（风险与风格偏好）

## 输出
- TradingPlan（JSON/Markdown）：execution（orderType/price/quantity/timing）、riskControls（stopLoss/takeProfit/maxLoss/positionSize）、reasoning、statusHistory。

## 步骤（示例）
```bash
# TODO：接入生成脚本
# node ./scripts/plan/create-plan.js --analysis ./output/AAPL-analysis.json --portfolio ./portfolio.json --prefs ./prefs.json --out ./output/AAPL-plan.json
```

## 门禁（Gates）
- positionSize 满足偏好与组合约束；给出明确 stopLoss/takeProfit 与 maxLoss。
- 记录 reasoning 与引用的 memoryIds（如有）。

## 审核
- 提交：TradingPlan 产物 + 参数摘要。
- 回收：按 Manager 意见调整参数与风险边界。
