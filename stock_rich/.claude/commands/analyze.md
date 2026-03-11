完整的自选股分析流程：获取数据 → 搜索消息面 → 生成日报。

## 用法
`/analyze` — 自动从 matches.json 读取 symbols
`/analyze NVDA,TSM` — 指定 symbols

## 执行步骤

### 1. 确定分析标的
- 如果指定了 $ARGUMENTS，使用指定的 symbols
- 否则读取 `data/daily/{今日日期}/matches.json`，提取 symbols 列表

### 2. 获取真实数据
```bash
npm run data -- --symbols {symbols逗号分隔}
```
读取 `data/daily/{今日日期}/stockdata.json` 确认数据就绪。

### 3. 搜索消息面 + 内幕交易
```bash
npm run news -- --symbols {symbols逗号分隔}
```
读取 `data/daily/{今日日期}/news-{SYMBOL}.json`，包含多源新闻 + 内幕交易数据。
用 WebSearch 补充分析师评级变动详情（如需要）。

### 4. 读取战法规则
读取 `.claude/personal.md` 了解 11 个期权战法的触发条件。

### 5. 逐只股票深度分析
基于 stockdata.json 的真实数据 + 消息面搜索结果：

- **基本面快照**: 股价、PE、市值、财报亮点/雷点、目标价共识
- **技术面分析**: 均线、布林带、RSI、MACD、支撑阻力位，威科夫阶段，期权最大痛点，做空情况
- **消息面**: 重大新闻、评级变动、社交情绪、内幕交易概况
- **战法匹配**: 基于 stockdata.json 数据 + personal.md 规则，综合判断是否触发
- **KOL 观点整合**: 从 matches.json 提取 KOL 提及和情绪（如有）

### 6. 生成日报
将分析结果写入 `output/{今日日期}.md`，中文撰写，KOL 原文保留原始语言。
