每日完整分析流程：采集 → 匹配 → 分析，带交互式暂停点。

## 用法
`/daily` — 使用今日日期
`/daily 2026-02-19` — 指定日期

---

## Phase 1: 采集 KOL 数据

```bash
npm run collect -- --date {date}
```

采集完成后，读取 `data/daily/{date}/posts.json`，按平台汇总展示：
- 共采集 N 条发言（Twitter X条 / 微博 X条 / YouTube X条）
- 列出每条发言的 KOL 名称、摘要（前80字）、平台

### ⏸️ 暂停点 1
告诉用户：
> 以上是今日采集到的 KOL 发言。你可以：
> 1. 手动编辑 `data/daily/{date}/posts.json` 增删内容
> 2. 直接回复"继续"进入匹配阶段
> 3. 告诉我需要补充哪些 KOL 或内容

等待用户确认后再继续。

---

## Phase 2: 语义匹配自选股（Claude Code LLM 分析）

读取：
- `data/daily/{date}/posts.json`（可能已被用户编辑）
- `config/watchlist.json`

逐条分析每条 KOL 发言，用 LLM 语义理解判断与自选股的关联：

**匹配规则（按优先级）：**
1. 直接提及：股票代码（$NVDA）、公司名（NVIDIA/英伟达）、产品名（Blackwell）
2. 强关联：讨论主题与某股核心业务直接相关（如 HBM 产能 → MU、SK Hynix）
3. 板块联动：讨论整个板块趋势（如"AI芯片需求暴增"→ NVDA, AMD, AVGO）
4. 宏观影响：宏观政策对特定股票的影响（如"降息预期"→ 利好成长股）

**不匹配：** 泛泛而谈、关联太弱、纯情绪发泄

**情绪判断：** bullish / bearish / neutral（基于 LLM 对上下文的理解）

将结果保存到 `data/daily/{date}/matches.json`，格式：
```json
{
  "matched": [{ "kolId", "kolName", "platform", "text", "matches": [{ "symbol", "reason" }], "sentiment" }],
  "symbols": ["NVDA", "TSM"]
}
```

展示匹配结果：
- 匹配到 N 只股票：NVDA, TSM, ...
- 每只股票被哪些 KOL 提及、匹配原因、情绪倾向

### ⏸️ 暂停点 2
告诉用户：
> 以上是语义匹配结果。你可以：
> 1. 增加遗漏的股票（如"加上 AAPL 和 MSFT"）
> 2. 删除误匹配的股票（如"去掉 XYZ"）
> 3. 手动编辑 `data/daily/{date}/matches.json`
> 4. 直接回复"继续"进入深度分析

等待用户确认后再继续。如果用户要求增删股票，更新 matches.json 后再次展示。

---

## Phase 3: 深度分析

### 3a. 获取真实数据
```bash
npm run data -- --symbols {symbols逗号分隔}
```
读取 `data/daily/{date}/stockdata.json` 确认数据就绪。

### 3b. 搜索消息面 + 内幕交易
```bash
npm run news -- --symbols {symbols逗号分隔}
```
读取 `data/daily/{date}/news-{SYMBOL}.json`，包含：
- Twitter/Reddit/Google News/Yahoo Finance 多源新闻
- 内幕交易记录 + 买卖汇总

用 WebSearch 补充分析师评级变动详情（如需要）。

### 3c. 逐只股票分析
读取 `.claude/personal.md` 了解 11 个期权战法规则。

基于 stockdata.json 真实数据 + 消息面搜索结果，对每只股票：
- **基本面快照**: 股价、PE、市值、财报亮点/雷点、目标价共识
- **技术面分析**: 均线、布林带、RSI、MACD、支撑阻力位，威科夫阶段，期权最大痛点，做空情况
- **消息面**: 重大新闻、评级变动、社交情绪、内幕交易概况
- **战法匹配**: 基于 stockdata.json 数据 + personal.md 规则，综合判断触发条件
- **KOL 观点整合**: 从 matches.json 提取 KOL 提及和情绪

### 3d. 生成日报
将分析结果写入 `output/{date}.md`，中文撰写，KOL 原文保留原始语言。

### ⏸️ 暂停点 3
告诉用户：
> 日报已生成到 `output/{date}.md`。你可以：
> 1. 要求对某只股票补充分析
> 2. 调整某个分析结论
> 3. 完成
