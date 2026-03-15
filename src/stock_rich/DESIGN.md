# Stock Rich — 每日 KOL 观点追踪与股票分析系统

## 1. 项目概述

本地运行的 Node.js 应用，代码负责数据采集（Twitter/微博/YouTube KOL 发言）和金融数据获取（yahoo-finance2 基本面+技术面），Claude Code LLM 负责语义匹配、深度分析、战法判断和日报撰写。

## 2. 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 主框架 | Node.js (v18+) | CLI 工具，TypeScript |
| 微博采集 | weibo.com AJAX API | 纯 Node.js, 需 Cookie |
| Twitter 采集 | rettiwt-api (guest 模式) | 免费, 无需 API Key |
| YouTube 采集 | youtube-transcript + RSS | 免费 |
| 金融数据 | yahoo-finance2 | 免费，覆盖美股+港股 |
| 技术指标 | technicalindicators | 本地计算，无 API 调用 |
| YouTube 摘要 | Claude (通过 Claude Code 手动) | 或 Gemini Flash 免费 API |
| 包管理 | pnpm | |

## 3. 项目结构

```
stock_rich/
├── DESIGN.md                    # 本文档
├── package.json
├── tsconfig.json
├── .env                         # API keys
├── .claude/
│   ├── claude.md                # Claude Code 项目上下文
│   ├── personal.md              # 个人操作指南（11个期权战法）
│   └── commands/                # Claude Code Skills
│       ├── daily.md             # 完整交互式流程
│       ├── analyze.md           # 深度分析流程
│       ├── data.md              # 获取真实金融数据
│       ├── news.md              # 多源消息面搜索
│       └── trade.md             # 期权交易分析（量化+综合研判）
├── config/
│   ├── watchlist.json           # 自选股列表
│   └── kols.json                # KOL 配置
├── src/
│   ├── index.ts                 # CLI 入口（collect, data, options）
│   ├── collectors/
│   │   ├── twitter.ts           # rettiwt-api Twitter 采集
│   │   ├── weibo.ts             # weibo.com AJAX API 采集
│   │   └── youtube.ts           # YouTube RSS + 字幕采集
│   ├── analysis/
│   │   ├── fundamental.ts       # 基本面数据获取
│   │   ├── technical.ts         # 技术指标计算 + 威科夫 + 目标价
│   │   └── options.ts           # 期权量化引擎（Greeks/IVR/Skew/GEX/EM/胜率）
│   └── utils/
│       ├── yahoo.ts             # yahoo-finance2 封装 (限速+重试+期权)
│       ├── cache.ts             # 数据缓存
│       └── date.ts              # 日期工具
├── data/
│   ├── daily/                   # 每日数据 (JSON)
│   │   └── {date}/
│   │       ├── twitter.json
│   │       ├── weibo.json
│   │       ├── youtube.json
│   │       ├── posts.json       # 合并后的 KOL 发言
│   │       ├── matches.json     # Claude Code 语义匹配结果
│   │       ├── stockdata.json   # 金融数据
│   │       └── options-{SYMBOL}-{EXPIRY}.json  # 期权量化分析
│   └── cache/                   # 金融数据缓存
├── output/
│   └── {date}.md                # Claude Code 生成的日报
└── scripts/
    └── setup-weibo.sh           # 微博爬虫安装脚本
```

## 4. 配置文件格式

### 4.1 watchlist.json — 自选股列表

```json
{
  "stocks": [
    {
      "symbol": "NVDA",
      "name": "NVIDIA",
      "market": "US",
      "sector": "半导体",
      "tags": ["AI", "GPU", "数据中心"],
      "notes": "核心持仓，CoWoS 产能链龙头"
    },
    {
      "symbol": "0700.HK",
      "name": "腾讯",
      "market": "HK",
      "sector": "互联网",
      "tags": ["游戏", "社交", "AI"],
      "notes": ""
    }
  ]
}
```

字段说明：
- `symbol`: Yahoo Finance 格式的股票代码（美股直接用 ticker，港股用 `XXXX.HK`）
- `tags`: 股票相关关键词，供 Claude Code LLM 语义匹配参考
- `sector`: 板块分类，供板块联动分析参考

### 4.2 kols.json — KOL 配置

```json
{
  "kols": [
    {
      "id": "kol_001",
      "name": "某财经大V",
      "platforms": {
        "twitter": { "username": "example_handle" },
        "weibo": { "uid": "1234567890" },
        "youtube": { "channelId": "UCxxxxxxxx" }
      },
      "expertise": ["宏观", "美股"],
      "reliability": 4,
      "language": "zh"
    }
  ]
}
```

字段说明：
- `platforms`: 各平台账号，缺省表示该平台不追踪
- `expertise`: 擅长领域，辅助语义匹配权重
- `reliability`: 1-5 可信度评分
- `language`: 主要语言 (zh/en)

## 5. 数据采集方案

### 5.1 Twitter — rettiwt-api

- 使用 rettiwt-api npm 包的 guest 模式 (免费, 无需 API Key)
- 通过 `user.details(username)` 获取用户 ID，再 `user.timeline(id, 20)` 获取最近推文
- 每日运行一次，获取过去 24 小时的推文
- 存储原始数据到 `data/daily/{date}/twitter.json`

### 5.2 微博 — weibo.com AJAX API

- 纯 Node.js，通过 `weibo.com/ajax/statuses/mymblog` 桌面端 AJAX API 获取
- 需要 weibo.com Cookie (在 .env 中配置 WEIBO_COOKIE)
- 每个 KOL 间隔 2s 限速
- 输出 JSON 到 `data/daily/{date}/weibo.json`

### 5.3 YouTube — RSS + Transcript

流程：
1. 通过 YouTube RSS feed (`/feeds/videos.xml?channel_id=XXX`) 检测新视频
2. 使用 `youtube-transcript` npm 包提取字幕文本
3. 字幕文本暂存，后续由 Claude Code 手动生成摘要
4. 存储到 `data/daily/{date}/youtube.json`

## 6. 每日 Markdown 日报格式

文件路径: `output/{date}.md`

```markdown
# 📊 每日观点与分析 — 2026-02-17

## 一、KOL 观点汇总

### 🐦 Twitter

#### [KOL名称] (@handle) — 可信度: ⭐⭐⭐⭐
> 原文内容（保留原始语言）
> ...

**关联自选股**: NVDA, TSM
**情绪倾向**: 看多
**关键词**: AI基础设施, 数据中心扩张

---

#### [KOL名称2] ...

### 📱 微博

#### [KOL名称] — 可信度: ⭐⭐⭐⭐⭐
> 原文内容...

**关联自选股**: 0700.HK
**情绪倾向**: 中性
**关键词**: 游戏出海, AI应用

---

### 📺 YouTube

#### [KOL名称] — [视频标题]
**发布时间**: 2026-02-17
**视频摘要**:
> （字幕摘要，由 LLM 生成）

**关联自选股**: AAPL, MSFT
**情绪倾向**: 看空

---

## 二、自选股分析

> 以下分析仅针对当日被 KOL 提及或关联的股票

### NVDA — NVIDIA

#### 基本面快照
| 指标 | 数值 |
|------|------|
| Trailing P/E | 65.2 |
| Forward P/E | 42.1 |
| 营收 (TTM) | $130.5B |
| 净利润 (TTM) | $72.8B |
| 营收增速 (YoY) | +94.2% |
| 利润增速 (YoY) | +108.5% |
| 自由现金流 (TTM) | $60.2B |
| 资本支出 (TTM) | $3.8B |
| FCF/Capex 比率 | 15.8x |
| 分析师目标均价 | $185.00 |
| 分析师评级 | Strong Buy |

#### 技术面分析

**日线 (Daily)**
| 指标 | 数值 | 信号 |
|------|------|------|
| 收盘价 | $152.30 | |
| MA30 | $148.50 | 价格在 MA30 上方 ✅ |
| MA60 | $140.20 | 价格在 MA60 上方 ✅ |
| MA120 | $125.80 | 价格在 MA120 上方 ✅ |
| 布林带上轨 | $162.00 | |
| 布林带中轨 | $148.50 | |
| 布林带下轨 | $135.00 | |
| MACD | 金叉/死叉 | 金叉 ✅ |
| RSI(14) | 62.5 | 中性区间 |

**周线 (Weekly)** — 同上格式
**月线 (Monthly)** — 同上格式

**关键价位**:
- 一个月目标价: $170.00 (基于布林带上轨 + 分析师目标价加权)
- 支撑位 S1: $148.50 (MA30)
- 支撑位 S2: $140.20 (MA60)
- 阻力位 R1: $162.00 (布林带上轨)

#### 战法匹配

> 基于当前技术形态和 KOL 情绪，匹配个人操作指南中的战法

**可能触发: 3. 龙头趋势/龙回头 (Dragon) ⭐⭐⭐⭐⭐**
- 触发条件: 绝对龙头强趋势上涨后的首次缩量回踩
- 当前状态: 价格回踩 MA30 ($148.50) 附近，成交量萎缩
- 期权建议: 当周或下周 ATM Call
- 仓位上限: 总仓位 10%
- 止盈: 反弹至前高或翻倍撤本
- 止损: 收盘有效跌破 MA30

---

### 0700.HK — 腾讯
（同上格式）

---

## 三、我的思考

> （用户手动编辑区域，每日复盘和个人洞察）

---

## 四、今日宏观环境备注

> （可选：当日重要宏观事件、美联储动态等）

---

*生成时间: 2026-02-17 22:00 EST*
*数据来源: Yahoo Finance, Apify, weibo-crawler, YouTube Transcript*
```

## 7. 技术分析规格

### 7.1 使用 technicalindicators 计算

```typescript
// 需要计算的指标
interface TechnicalIndicators {
  // 移动平均线
  ma30: number;
  ma60: number;
  ma120: number;

  // 布林带 (20日, 2倍标准差)
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;

  // MACD (12, 26, 9)
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  macdCross: 'golden' | 'death' | 'none'; // 金叉/死叉

  // RSI (14日)
  rsi: number;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  // overbought > 70, oversold < 30
}
```

### 7.2 威科夫阶段检测 (Wyckoff)

基于最近 60 根日线 K 线，通过量价关系判断当前所处的威科夫阶段：

| 阶段 | 检测逻辑 |
|------|---------|
| 吸筹 (Accumulation) | 横盘 + 上涨日成交量 > 下跌日成交量 15%+ + 前期下跌 |
| 拉升 (Markup) | 上升趋势 + 上涨放量确认 |
| 派发 (Distribution) | 横盘 + 下跌日成交量 > 上涨日成交量 15%+ + 前期上涨 |
| 下跌 (Markdown) | 下降趋势 + 下跌放量确认 |

置信度评分 (0-100)：基础 50 + 量价确认 15 + 前趋势确认 15 + RSI 确认 10 + 区间紧凑 10

### 7.3 期权最大痛点 (Max Pain)

通过 yahoo-finance2 的 `options()` API 获取当周/次周期权链，计算 max pain：
- 遍历所有 strike，计算该 strike 下所有 call/put 的 ITM 总损失
- Max pain = 总损失最小的 strike（期权卖方利润最大化的价格）
- 同时输出 Put/Call OI 比率
- 缓存 4 小时

### 7.4 做空数据

从 yahoo-finance2 的 `defaultKeyStatistics` 模块提取：
- shortPercentOfFloat — 做空占流通股比例
- shortRatio — 空头回补天数 (Days to Cover)
- sharesShort / sharesShortPriorMonth — 当月/上月做空股数

### 7.5 目标价计算逻辑

一个月目标价 = 加权平均:
- 布林带上轨 (权重 30%)
- 分析师目标均价 (权重 40%)
- 基于趋势的线性外推 (权重 30%)

支撑位:
- S1 = MA30 或布林带中轨 (取较近者)
- S2 = MA60
- S3 = MA120 或布林带下轨

阻力位:
- R1 = 布林带上轨
- R2 = 近期高点
- R3 = 分析师目标高价

## 8. 战法匹配逻辑

基于 `.claude/personal.md` 中的 11 个战法，由 Claude Code LLM 结合 stockdata.json 真实数据 + 消息面 + KOL 情绪综合判断：

| 战法 | 判断要点 |
|------|---------|
| 1. 末日逆转 | RSI < 30 + 价格在强支撑位 + KOL 情绪极度悲观 |
| 2. 狂热顶点 | RSI > 80 + 价格远离 MA30 + KOL 情绪极度乐观 |
| 3. 龙回头 | 龙头股 + 首次回踩 MA10/MA20 + 成交量萎缩 |
| 4. 财报后反抽 | 近期财报超预期 + 股价大跌 + 到达支撑位 |
| 5. 黄金坑 | 优质股 + 系统性下跌(非基本面) + 底部缩量 |
| 6. 极端转折 | 基本面利空 + RSI > 70 + 宏观数据利空 |
| 7. 利好陷阱 | 大利好 + 高开低走 + 缩量 |
| 8. 热点补涨 | 板块集体上涨 + 该股低位未动 |
| 9. 财报前跑 | 距财报 3-5 天 + 缩量 |
| 10. 利好钝化 | 连续利好 + 股价不涨 |
| 11. 财报盲盒 | 财报当晚 (仅标记，不建议) |

注意：战法匹配完全由 Claude Code LLM 完成，可综合考虑技术指标、消息面、KOL 情绪、宏观背景等多维度信息，比规则引擎更准确。

## 9. 语义匹配规则

KOL 发言 → 自选股匹配完全由 Claude Code LLM 完成，读取 posts.json + watchlist.json 进行语义分析：

1. **直接提及**: 股票代码（$NVDA）、公司名（NVIDIA/英伟达）、产品名（Blackwell）
2. **强关联**: 讨论主题与某股核心业务直接相关（如 HBM 产能 → MU、SK Hynix）
3. **板块联动**: 讨论整个板块趋势（如"AI芯片需求暴增"→ NVDA, AMD, AVGO）
4. **宏观影响**: 宏观政策对特定股票的影响（如"降息预期"→ 利好成长股）

**不匹配**: 泛泛而谈、关联太弱、纯情绪发泄

## 10. CLI 命令设计

```bash
# 代码提供三个命令（数据采集 + 数据获取 + 期权分析）

# 采集 KOL 数据 → data/daily/{date}/posts.json
npm run collect
npm run collect -- --platform twitter
npm run collect -- --date 2026-02-17

# 获取金融数据 → data/daily/{date}/stockdata.json
npm run data -- --symbols NVDA,TSM
npm run data -- --symbols NVDA,TSM --date 2026-02-17

# 期权量化分析 → data/daily/{date}/options-{SYMBOL}-{EXPIRY}.json
npm run options -- --symbol NVDA --expiry 2026-02-27 --direction call
```

语义匹配、深度分析、战法判断、日报撰写全部由 Claude Code Skills 完成：
```
/daily              # 完整交互式流程（KOL → 日报）
/analyze NVDA,TSM   # 深度分析指定股票
/data NVDA,TSM      # 获取并展示金融数据
/news NVDA,TSM      # WebSearch 搜索消息面
/trade NVDA 2026-02-27 call  # 期权交易分析（量化+综合研判）
```

## 11. 缓存策略

- **OHLCV 历史数据**: 按股票+日期缓存，历史数据不变，仅追加当日
- **基本面数据**: 每日更新一次，缓存 24 小时
- **期权数据**: 缓存 4 小时 (盘中 max pain 变化较慢)
- **KOL 数据**: 每日采集一次，按日期存储，不覆盖
- yahoo-finance2 请求限速: 每次请求间隔 1.5 秒，429 错误时指数退避重试 (最多 3 次)

## 12. 架构说明

代码层只负责两件事：
1. **数据采集** (`npm run collect`) — 调用 Twitter/微博/YouTube API 获取 KOL 发言
2. **数据获取** (`npm run data`) — 调用 yahoo-finance2 获取基本面+技术面，本地计算技术指标
3. **期权分析** (`npm run options`) — 获取期权链，计算 Greeks/IVR/Skew/GEX/EM/胜率

所有需要"理解"和"判断"的工作由 Claude Code LLM 完成：
- 语义匹配（KOL 发言 → 自选股关联）
- 情绪分析（bullish/bearish/neutral）
- 战法匹配（结合 personal.md 规则 + 多维度数据）
- 消息面搜索与整合（WebSearch）
- 日报撰写（output/{date}.md）
- 期权交易综合研判（/trade skill：量化数据 × 技术面 × 消息面 × 战法 → 交易建议）

## 15. 期权量化分析引擎 V2

### 15.1 概述

`src/analysis/options.ts` 是期权量化分析的核心引擎。它只做数学计算，不做任何"判断"。
所有交易决策由 `/trade` skill 中的 LLM 综合研判完成。

**数据流**：
```
yahoo-finance2 期权链 + 历史OHLCV + 宏观指数
    ↓
options.ts 计算 (BS Greeks, IVR, IV-RV, Skew, 期限结构, GEX, MC, ...)
    ↓
options-{SYMBOL}-{EXPIRY}.json
    ↓
LLM 综合研判 ← stockdata.json (技术面+BB Squeeze)
              ← news-{SYMBOL}.json (消息面+内幕交易)
              ← WebSearch (分析师评级+宏观补充)
              ← personal.md (11大战法规则)
```

**数据复用**: stockdata.json 和 news-*.json 在 /daily 和 /trade 之间共享。
代码层自动检查已有数据，跳过已存在的 symbol，避免重复抓取。

### 15.2 算法详解

#### a) Black-Scholes Greeks (含 Vanna & Charm)

**输入**: S(股价), K(行权价), T(到期年化), r(无风险利率=0.045), σ(IV)

**核心公式**:
- `d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)`
- `d2 = d1 - σ√T`
- `N(x)` = 标准正态 CDF (Abramowitz & Stegun 近似)
- `n(x)` = 标准正态 PDF

**一阶 Greeks**:
- Delta (Call) = N(d1), Delta (Put) = N(d1) - 1
- Gamma = n(d1) / (S × σ × √T)
- Theta (Call) = [-S×n(d1)×σ/(2√T) - r×K×e^(-rT)×N(d2)] / 365
- Vega = S × n(d1) × √T / 100 (每 1% IV 变化)

**二阶 Greeks (V2 新增)**:
- Vanna = -n(d1) × d2 / (σ × 100) — IV 变化引起的 delta 变化，反映做市商在 IV 暴增时被迫买卖正股的抛压
- Charm = -n(d1) × (2rT - d2σ√T) / (2Tσ√T) / 365 — 时间流逝导致的 delta 衰减，评估对冲失衡

**数据来源**: yahoo-finance2 `options()` API 提供每个合约的 impliedVolatility

#### b) IVR (波动率百分位)

**HV 计算**: 取 14 个月日线收盘价 → 滚动 20 日对数收益率标准差 × √252 (年化)
```
logReturn_i = ln(close_i / close_{i-1})
HV_20 = std(logReturn, 20日窗口) × √252
```

**HV 百分位**: 当前 HV_20 在过去 ~252 个 HV_20 值中的百分位排名
**ATM IV 百分位**: 当前 ATM 期权 IV 在 HV 分布中的百分位

**判定阈值**:
- < 30% → 期权便宜，适合买入 (ivrLow=true)
- > 50% → 期权贵，非财报日阻断单边买入 (ivrHigh=true)

**数据来源**: yahoo-finance2 `chart()` API 获取历史 OHLCV

#### c) IV-RV Spread (V2 新增)

**公式**: `ivRvSpread = ATM_IV - HV_20`

**判定**:
- < 0 → 期权被低估（IV 低于实际波动率，买方有利）
- 0 ~ 0.05 → 合理定价
- > 0.05 → 期权被高估（卖方有利，买方不利）

#### d) IV Skew (波动率偏度)

**公式**: `skew = 25DeltaPutIV - 25DeltaCallIV`

**25-delta 查找**: 遍历所有合约，计算 BS delta，找最接近 -0.25 (Put) 和 0.25 (Call) 的合约

**判定**:
- > 0.05 → 恐慌 (Put 贵，市场买保险)
- < -0.05 → 狂热 (Call 贵，市场追涨)
- |skew| > 0.10 → 极端情绪 (skewExtreme=true)

#### e) 期限结构 (V2 新增)

**公式**: `termStructure = nearATM_IV - farATM_IV`

**实现**: 获取目标到期日的 ATM IV (near)，再获取 ~90 天远端到期日的 ATM IV (far)

**判定**:
- > 0 → 近端事件溢价 / backwardation（事件临近，近端 IV 被推高）
- < 0 → 正常 contango（远端 IV 更高，无特殊事件）

**数据来源**: yahoo-finance2 `options()` API 获取两个不同到期日的期权链

#### f) GEX / Gamma Flip (V2: S² 机构标准公式)

**假设**: 做市商 short calls, long puts（标准市场微观结构）

**公式 (V2 修正)**:
```
CallGEX = Gamma × CallOI × 100 × S²
PutGEX = -Gamma × PutOI × 100 × S²
NetGEX = Σ(CallGEX + PutGEX)
```
注: V1 使用 S，V2 修正为 S²，更准确反映做市商对冲的美元流量。

**Gamma Flip**: 遍历行权价，找 NetGEX 从正变负的价格点
- 股价在 Gamma Flip 上方 → 做市商助涨（正 Gamma 区）
- 股价在 Gamma Flip 下方 → 做市商助跌（负 Gamma 区，踩踏风险）
- 股价距 Gamma Flip < 3% → nearGammaFlip=true

**OI 墙 (V2 新增)**: 找 Call/Put 最大 OI 的行权价
- maxCallOiStrike: Call OI 墙（潜在阻力）
- maxPutOiStrike: Put OI 墙（潜在支撑）

#### g) Vanna & Charm (V2 新增)

见 §15.2a 中的公式。每个合约的 Greeks 输出中包含 vanna 和 charm。

**做市商对冲含义**:
- 高 Vanna + IV 上升 → 做市商被迫买入正股（助涨）
- 高 Charm + 临近到期 → delta 快速衰减，做市商减少对冲（波动加剧）

#### h) Expected Move (EM)

**公式**: `EM = (ATM_Call_Mid + ATM_Put_Mid) × 0.85`

代表市场隐含的到期前价格波动范围。只选 EM 边缘的 OTM 合约。

#### i) Vol/OI + Strike 集中度

**Vol/OI**: `volume / openInterest`，> 3.0 标记为异常（大资金新增方向性头寸）

**Strike 集中度 (V2 新增)**: `contractVolume / totalDirectionVolume`
- > 0.20 (20%) → 标记为"机构目标价"

#### j) 流动性过滤 (V2 新增)

**公式**: `bidAskSpreadPct = (ask - bid) / mid × 100`

**判定**:
- > 50% → illiquid，从 Top 5 候选中剔除
- > 30% → liquidityWarning=true，降级警告

#### k) Gamma Squeeze / Panic Crash 检测 (V2 新增)

**Gamma Squeeze Risk**:
- 股价距 Call OI 墙 < 5% + NetGEX < 0 + Call 总成交量 > 2× 平均
- 含义: 做市商被迫买入正股对冲，引发逼空

**Panic Crash Risk**:
- ivSkew > 0.10 + nearGammaFlip=true + Put 总成交量 > 2× 平均
- 含义: 做市商被迫卖出正股对冲，引发踩踏

#### l) Monte Carlo Jump Diffusion (V2 新增)

**模型**: `dS = μSdt + σSdW + J×dN`
- μ = r (无风险利率)
- σ = 合约 IV
- W = 标准布朗运动
- J ~ N(jumpMean=-0.05, jumpStd=0.10) 跳跃幅度
- N ~ Poisson(λ=0.1/年) 跳跃频率

**参数**: 3000 路径，单步到期终值模拟

**使用策略**: 对数正态解析解做全部合约快速筛选 → MC 仅对 Top 5 候选精算
- 输出: mcPProfit, mcP5x, mcP10x, mcEv

**优势**: 比纯对数正态更准确捕捉尾部事件概率（5x/10x），因为引入了跳跃项

#### m) 概率与 EV 计算

**对数正态 (快速筛选)**:
- P(S_T > target) = N(d2)，其中 d2 = [ln(S/target) + (r-σ²/2)T] / (σ√T)
- EV = P(10x)×10 + P(5x)×5 + P(profit)×2 - (1-P(profit))

**Monte Carlo (Top 5 精算)**:
- mcEv = mcP10x×10 + mcP5x×5 + mcPProfit×2 - (1-mcPProfit)

#### n) 宏观快照 (V2 新增)

**数据**: yahoo-finance2 `quote()` API
- ^VIX → VIX 恐慌指数
- ^TNX → 10Y 国债收益率 (除以 100 转换为小数)

**缓存**: 4 小时

### 15.3 输出接口 (OptionsAnalysis)

```typescript
interface OptionsAnalysis {
  symbol: string;
  expirationDate: string;
  direction: 'call' | 'put';
  currentPrice: number;
  daysToExpiry: number;
  // 量化仪表盘
  hvIvrPercentile: number;      // 0-100
  atmIvPercentile: number;      // 0-100
  atmIv: number;
  ivRvSpread: number;           // V2: ATM IV - HV20
  ivSkew: number;
  termStructure: number;        // V2: nearIV - farIV
  farExpiryIv: number | null;   // V2: 远端 ATM IV
  expectedMove: number;
  expectedMovePercent: number;
  gex: { netGex, gammaFlipPrice, gexByStrike[], maxCallOiStrike, maxPutOiStrike };
  maxPainStrike: number | null;
  callOI: number;
  putOI: number;
  pcRatio: number;
  macro: { vix, tenYearYield, fetchedAt };  // V2
  // 策略信号
  signals: {
    ivrLow, ivrHigh, skewExtreme, skewDirection,
    volOiAnomalies[], nearGammaFlip, withinEm,
    gammaSqueezeRisk, panicCrashRisk  // V2
  };
  // Top 5 推荐
  top5: ContractAnalysis[];  // 含 vanna, charm, bidAskSpreadPct, strikeConcentration, mcPProfit/5x/10x/Ev
  volOiAnomalies: VolOiAnomaly[];
}
```

### 15.4 后续优化方向
- 接入 Unusual Whales / FlowAlgo 等付费数据源获取 Sweep Ratio
- 实时 Greeks 更新（盘中多次计算）
- EventMove vs ImpliedMove 历史对比（需积累历史财报数据）

### 15.5 回测计划 (TODO)

**问题**: yahoo-finance2 只提供实时期权链，无历史期权数据。回测需要历史期权快照（每天每个行权价的 IV、Greeks、OI、Volume、bid/ask）。

**方案**: 买一个月付费数据源，批量拉 3 个月（~60 交易日）历史期权数据到本地，一次性回测后取消。

**数据源对比**:

| 数据源 | 价格 | 历史期权数据 | 备注 |
|--------|------|-------------|------|
| [Polygon.io](https://polygon.io/options) | Options Developer $79/月 或 Advanced $199/月 | EOD 期权链快照（所有行权价、IV、Greeks、OI、Volume） | Starter $29 可能只有聚合数据不含逐行权价快照，需确认；REST API，Node.js SDK 可用 |
| [ThetaData](https://www.thetadata.net/) | $30/月起 (Standard) | EOD 历史期权数据，社区评价比 Polygon 更专业 | 专注期权数据，数据质量好；Python SDK 为主，也有 REST API |

**回测架构设计**:
```
1. 数据拉取脚本 (src/backtest/fetch.ts)
   - 输入: 自选股子集 (10-15只核心标的) × 3个月日期范围
   - 对每个交易日: 拉取完整期权链快照 + 正股 OHLCV
   - 输出: data/backtest/{symbol}/{date}.json

2. 回测引擎 (src/backtest/engine.ts)
   - 遍历每个交易日，用历史数据喂给 options.ts 引擎
   - 记录每天的量化信号 (IVR, Skew, GEX, Squeeze/Crash, etc.)
   - 模拟 6 大驱动源的触发情况
   - 对比实际后续走势，计算信号准确率和策略收益

3. 回测报告 (src/backtest/report.ts)
   - 信号命中率统计
   - 各驱动源/战法的历史胜率和平均收益
   - 一票否决规则的过滤效果
   - MC 概率 vs 实际概率的校准曲线
```

**执行步骤**:
1. 选择数据源（Polygon.io 或 ThetaData），订阅一个月
2. 写 fetch.ts 批量拉取历史数据到本地
3. 写 engine.ts 回测引擎
4. 跑回测，输出报告
5. 根据回测结果调整算法参数（MC jump 参数、阈值等）
6. 取消订阅

## 13. 环境变量 (.env)

```
WEIBO_COOKIE=optional_weibo_cookie
```

## 14. 预估成本

| 项目 | 月费用 |
|------|--------|
| rettiwt-api (Twitter) | $0 |
| 微博 | $0 |
| YouTube | $0 |
| Yahoo Finance | $0 |
| **合计** | **$0/月** |
