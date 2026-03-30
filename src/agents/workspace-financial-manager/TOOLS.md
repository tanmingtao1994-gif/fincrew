# Tools: Financial Manager

## Decision-Making Skills
- **analyzeStock**: 分析个股并提供投资建议 (AnalyzeStockOutput schema)
  - 使用场景：综合各数据源后，为每只目标股票生成 buy/sell/hold/watch 结论
  - 输出包含：conclusion, confidence, assessment (fundamental/technical/sentiment), risk, recommendation
- **createTradingPlan**: 基于股票分析创建详细交易计划 (CreateTradingPlanOutput schema)
  - 使用场景：当 analyzeStock 结论为 buy 或 sell 时，生成可执行的交易计划
  - 输出包含：execution (orderType/price/quantity), riskControls (stopLoss/takeProfit), status
- **analyzeMarket**: 分析整体市场情感和板块趋势 (AnalyzeMarketOutput schema)
  - 使用场景：理解宏观市场环境，作为个股决策的背景参考

## Risk Control Skills
- **validateRiskControls**: 验证交易计划是否符合风险控制规则
  - 使用场景：在生成交易计划前/后验证仓位、止损等是否合规
- **checkRiskLimits**: 检查交易是否超出账户风险限制
- **validateTradeRequest**: 验证交易请求的有效性和完整性

## User Interaction Skills
- **requestUserConfirmation**: 请求用户确认关键操作（交易执行前必须确认）

## Memory Skills
- **updateMemory**: 更新长期记忆（记录交易决策和经验教训）
- **validateAgainstMemory**: 验证当前决策是否与历史经验/教训一致

## Sub-Agents (See AGENTS.md for details)
- **info-processor**: 数据采集 — 收集行情、新闻、KOL观点
- **macro-analyst**: 宏观分析 — 市场情绪、板块趋势、系统性风险
- **technical-analyst**: 个股技术分析 — 技术评分、均线/MACD/RSI 多时间框架分析、Wyckoff 阶段、支撑阻力位
- **reviewer**: 复盘分析 [未实现]
