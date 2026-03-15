# validateTradeRequest.skill

> 中文为主；英文专名与命令保留。

## 目标
- 验证 TradingPlan 的基本有效性：代码合法、价格/数量边界、资金充足等；在执行前给出明确结论与错误清单。

## 输入
- tradingPlan: JSON
- userPortfolio: JSON
- userPreference: JSON
- dryRun?: boolean（默认 true）

## 输出
- 校验结果：valid（boolean）、checks（ticker/price/quantity/funds/limits）、warnings、errors、estimatedCost/impact（如可算）。

## 步骤（示例）
```bash
# TODO：接入校验脚本
# node ./scripts/exec/validate-trade.js --plan ./output/AAPL-plan.json --portfolio ./portfolio.json --prefs ./prefs.json --dryRun true --out ./output/AAPL-validate.json
```

## 门禁（Gates）
- checks 字段完整，错误信息可读且可追溯。

## 审核
- 提交：校验摘要 + 产物路径；如 invalid，附主要错误与建议。
- 回收：按 Manager 指示修正计划参数并复核。
