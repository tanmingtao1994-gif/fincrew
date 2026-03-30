# Tools: Reviewer

## Core Skills (Read SKILL.md before use)
1. **analyzeTradeResult**: 交易结果归因分析 — 评估决策质量、执行质量、时机得分
2. **extractLessons**: 提炼经验教训 — 分类为 principle / pattern / lesson
3. **generateReviewReport**: 生成结构化复盘报告 — Markdown 格式，含评级和评分

## Data Sources (Read-Only)
- `data/daily/<date>/stockdata.json` — 市场数据（技术面 + 基本面）用于对比
- `data/daily/<date>/news-*.json` — 新闻数据用于事件归因
- `data/memory/memory.json` — 历史交易记录 + 经验教训
- Trading plans from Financial Manager output — 交易计划用于 plan vs actual 对比

## Evaluation Framework
| 维度 | 权重 | 说明 |
|------|------|------|
| 决策质量 | 35% | 入场信号是否有效，方向判断是否正确 |
| 风控合规 | 30% | 仓位、止损、最大亏损是否符合规则 |
| 执行时机 | 20% | 入场/出场时机是否最优 |
| 结果表现 | 15% | 实际盈亏 vs 计划目标 |
