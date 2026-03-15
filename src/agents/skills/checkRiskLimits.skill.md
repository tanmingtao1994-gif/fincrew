# checkRiskLimits.skill

> 中文为主；英文专名与命令保留。

## 目标
- 针对 TradingPlan 进行风控约束校验：最大仓位、止损比例、每日损失、集中度等，给出细项检查结果。

## 输入
- tradingPlan: JSON
- userPortfolio: JSON
- userPreference: JSON

## 输出
- passed（boolean）、checks（positionSize/stopLoss/dailyLoss/concentration）、errors。

## 步骤（示例）
```bash
# TODO：接入风控校验脚本
# node ./scripts/exec/check-risk.js --plan ./output/AAPL-plan.json --portfolio ./portfolio.json --prefs ./prefs.json --out ./output/AAPL-risk.json
```

## 门禁（Gates）
- 每项检查包含实际值与上限/下限的对比，便于定位超限点。

## 审核
- 提交：风控检查摘要 + 产物路径。
- 回收：按 Manager 建议调整参数并复核。
