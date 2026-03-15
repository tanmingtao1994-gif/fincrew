# validateRiskControls.skill

> 中文为主；英文专名保留。

## 目标
- 校验 TradingPlan 是否满足用户偏好与组合约束：最大仓位、止损阈值、每日损失、集中度等。

## 输入
- tradingPlan: JSON
- userPortfolio: JSON
- userPreference: JSON

## 输出
- 校验结果（valid/warnings/errors）与修正建议。

## 步骤（示例）
```bash
# TODO：接入校验脚本
# node ./scripts/plan/validate-risk.js --plan ./output/AAPL-plan.json --portfolio ./portfolio.json --prefs ./prefs.json --out ./output/AAPL-plan-check.json
```

## 门禁（Gates）
- 给出 positionSizeCheck、stopLossCheck、dailyLossCheck、concentrationCheck 等明细。

## 审核
- 提交：校验结果摘要 + 产物路径。
- 回收：按 Manager 建议调整计划参数并复核。
