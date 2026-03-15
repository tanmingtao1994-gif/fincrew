期权交易分析 V2：获取全维度数据 → 量化分析 → LLM 综合研判 → 交易建议。

## 用法
`/trade NVDA 2026-02-27 call`
`/trade TSM 2026-03-07 put`

参数格式: `{股票代码} {行权日 YYYY-MM-DD} {方向 call|put}`

---

## Phase 1: 数据采集（含复用检查）

### 1a. 基本面 + 技术面
检查 `data/daily/{今日日期}/stockdata.json` 是否已存在且包含该 symbol 的 key。
- **已有该 symbol** → 跳过，直接复用
- **没有** → 执行：
```bash
npm run data -- --symbols {symbol}
```
读取 `data/daily/{今日日期}/stockdata.json` 确认数据就绪。
注意：代码层已实现增量更新，不会覆盖已有 symbol 的数据。

### 1b. 期权量化分析（始终执行）
```bash
npm run options -- --symbol {symbol} --expiry {expiry} --direction {direction}
```
读取 `data/daily/{今日日期}/options-{SYMBOL}-{EXPIRY}.json`，包含：

**波动率估值:**
- IVR (HV百分位 + ATM IV百分位)
- IV-RV Spread (`atmIv - hv20`, 负值=期权被低估, >0.05=高估)
- IV Skew (25delta Put IV - 25delta Call IV)
- 期限结构 (`nearIV - farIV`, 正值=近端事件溢价/backwardation)

**做市商动态:**
- GEX / Gamma Flip (S²机构公式)
- Call OI 墙 / Put OI 墙
- Gamma Squeeze Risk / Panic Crash Risk 信号

**资金流:**
- Vol/OI 异常行权价 (>3.0)
- Strike 集中度 (>20% = 机构目标价)

**概率测算:**
- Expected Move (ATM Straddle × 0.85)
- Top 5 推荐行权价 (含 Greeks+Vanna+Charm, 流动性过滤, 对数正态+MC双轨概率)

**宏观快照:**
- VIX + 10Y 国债收益率

---

## Phase 2: 消息面搜索 + 内幕交易（限近 1 个月）

### 2a. 代码采集（结构化数据）
检查 `data/daily/{今日日期}/news-{SYMBOL}.json` 是否已存在。
- **已有** → 跳过，直接复用
- **没有** → 执行：
```bash
npm run news -- --symbols {symbol}
```
读取 `data/daily/{今日日期}/news-{SYMBOL}.json`，包含：
- `twitter`: Twitter $SYMBOL cashtag 搜索结果
- `reddit`: r/stocks, r/investing, r/wallstreetbets 搜索结果
- `googleNews`: Google News RSS 近 30 天新闻
- `yahooNews`: Yahoo Finance 相关新闻
- `insiderTrading`: 内幕交易记录 + 买卖汇总

### 2b. WebSearch 补充
用 WebSearch 补充代码采集不到的信息：
- `{symbol} analyst rating upgrade downgrade {当前月份} {当前年份}`
- `{symbol} earnings date {当前年份}`
- `VIX credit spread market sentiment {当前月份} {当前年份}`（宏观补充）

### 2c. KOL 发言检查
检查 `data/daily/{今日日期}/posts.json`（如果存在），查看 KOL 是否有提及该 symbol。

### ⏸️ 暂停点：消息面补充
展示已搜索到的消息面摘要（含内幕交易概况），然后告诉用户：
> 以上是近 1 个月的消息面信息。你可以：
> 1. 补充我遗漏的重要消息
> 2. 提供你从其他渠道获取的信息
> 3. 直接回复"继续"进入综合分析

---

## Phase 3: LLM 综合研判

读取 `.claude/personal.md` 了解 11 个期权战法的触发条件和仓位规则。

### 3.1 七维度交叉比对

**维度 1 — 期权量化数据** (options JSON)
| 字段 | 看什么 | 阈值/信号 |
|------|--------|----------|
| hvIvrPercentile | 期权绝对贵贱 | <30%=便宜(适合买入), >50%=贵(非财报阻断) |
| ivRvSpread | 期权相对估值 | <0=被低估, >0.05=被高估 |
| ivSkew | 市场情绪极值 | >0.10=恐慌(Put贵), <-0.05=狂热(Call贵) |
| termStructure | 事件临近检测 | >0=近端溢价(事件临近), <0=正常contango |
| gammaSqueezeRisk | 逼空风险 | true=价格接近Call OI墙+负Gamma+Call爆量 |
| panicCrashRisk | 踩踏风险 | true=Put Skew急升+接近GammaFlip+Put爆量 |
| gex.gammaFlipPrice | 做市商翻转点 | 股价距此<3%=高波动区 |
| volOiAnomalies | 大资金方向 | Vol/OI>3.0的行权价=新增方向性头寸 |
| top5[].mcEv | MC期望值 | >0=正期望, 越高越好 |
| top5[].bidAskSpreadPct | 流动性 | >30%=警告, >50%=剔除 |

**维度 2 — 正股技术形态** (stockdata JSON)
| 字段 | 看什么 |
|------|--------|
| 均线 MA30/60/120 | 价格与均线位置关系，趋势判断 |
| 布林带 | 上中下轨位置，bbSqueeze=爆发前兆 |
| MACD | 金叉/死叉，柱状图方向 |
| RSI | 超买(>70)/超卖(<30)/中性 |
| 威科夫 | 吸筹/拉升/派发/下跌 + 置信度 |
| 支撑阻力位 | S1/S2/S3, R1/R2/R3 |

**维度 3 — 消息面 & 财报日历** (news JSON + WebSearch)
- 距下次财报天数
- 近期重大新闻 (1-3 条)
- 分析师评级变动

**维度 4 — 内幕交易** (news JSON insiderTrading)
- 近期高管买卖方向、金额
- 净买入/卖出比例

**维度 5 — 宏观环境** (options JSON macro + WebSearch)
- VIX 水平 (<15=低波, 15-25=正常, >25=恐慌, >35=极端恐慌)
- 10Y yield 趋势 (快速上升=风险资产压力)
- 信用利差 (WebSearch 补充)
- 2026 宏观周期位置 (参考 personal.md 宏观推演)

**维度 6 — OI 墙 vs 技术面交叉验证**
- Call OI 墙 (gex.maxCallOiStrike) 是否与技术阻力位重合 → 强阻力
- Put OI 墙 (gex.maxPutOiStrike) 是否与技术支撑位重合 → 强支撑
- Max Pain 与当前价的距离 → 到期日磁吸方向

**维度 7 — 战法规则** (personal.md 11 大战法，辅助参考)

### 3.2 决策引擎：6 大利润驱动源

**核心认知**: 期权 5x 收益只来自以下 6 种场景。先判断"有没有机会"，再用 11 大战法确定"怎么执行"。

#### 驱动源 1: 财报前 (Earnings Run-up)
- **量化信号**: termStructure > 0 (近端IV抬头) + IVR从低位爬坡 + 距财报3-5天
- **技术面**: 缩量横盘，BB Squeeze
- **关联战法**: 战法9 财报前跑
- **期权选择**: 当周 Call, ≤$1,500

#### 驱动源 2: 财报中 (Earnings Gamble)
- **量化信号**: IVR极高(>80%) + EM测算 vs 历史EventMove对比
- **技术面**: 不适用（赌博性质）
- **关联战法**: 战法11 财报盲盒
- **期权选择**: 单边或跨式, 严禁超$1,000, 仅限利润参与
- **⚠️ 跨式拦截器**: IVR>80% 时禁止跨式建仓

#### 驱动源 3: 财报后 (Post-Earnings)
- **量化信号**: IV Crush完毕(IVR回落) + termStructure>0(远端IV抬头) + 基本面超预期被错杀 + OTM Call Vol/OI>3.0
- **技术面**: 回踩日线强支撑位，首根阳线
- **关联战法**: 战法4 财报后反抽
- **期权选择**: 2-4周 ATM/ITM Call, 总仓位10%

#### 驱动源 4: 宏观事件 (Macro Catalyst)
- **量化信号**: VIX异动(>25或突变>5点) + ivRvSpread<0(期权被低估) + FCF/Capex健康(非伪AI)
- **技术面**: 系统性错杀(非基本面)，底部缩量震荡
- **消息面**: 重大宏观事件(降息/IPO虹吸/政策)
- **关联战法**: 战法5 黄金坑(看多), 战法6 极端转折(看空)
- **期权选择**: 黄金坑→3月+ITM Call 15%; 极端转折→2周OTM Put ≤$3,000

#### 驱动源 5: 板块爆发 (Sector Explosion)
- **量化信号**: OTM Call Vol/OI>3.0 + strikeConcentration>20% + bbSqueeze=true
- **技术面**: 板块龙头已启动，该股低位未动或首次缩量回踩
- **消息面**: 板块级催化剂(行业政策/龙头财报带动)
- **关联战法**: 战法3 龙回头(龙头), 战法8 热点补涨(二线)
- **期权选择**: 龙回头→当周/下周ATM Call 10%; 补涨→当周ATM Call 5%

#### 驱动源 6: Gamma Squeeze / Panic Selloff
- **量化信号**: gammaSqueezeRisk=true 或 panicCrashRisk=true + skewExtreme=true + nearGammaFlip=true
- **技术面**: 极端超买/超卖，价格远离均线
- **关联战法**: 战法1 末日逆转(Panic Buy), 战法2 狂热顶点(Euphoria Sell)
- **期权选择**: 末日逆转→0-1DTE OTM Call ≤$3,000; 狂热顶点→1-2周OTM Put ≤$5,000

#### 额外覆盖（低频消息面触发）
- **利好陷阱** (战法7): 极大利好高开低走 + 下跌缩量 → 1周ATM Call ≤$2,000
- **利好钝化** (战法10): 连续3天利好不涨 → 1-2周Call ≤$1,000

### 3.3 辅助层：11 大战法执行参数

当主引擎判定存在机会后，匹配 personal.md 中的战法确定执行细节：

| # | 战法 | 期权选择 | 仓位上限 | 止盈 | 止损 |
|---|------|---------|---------|------|------|
| 1 | 末日逆转 | 0-1DTE OTM Call | ≤$3,000 (2%) | 3-10倍分批 | 15分钟破前低 |
| 2 | 狂热顶点 | 1-2周 OTM Put | ≤$5,000 (5%) | 回踩20日线 | 日线创新高 |
| 3 | 龙回头 | 当周/下周 ATM Call | 10% | 反弹前高或翻倍撤本 | 收盘破均线 |
| 4 | 财报后反抽 | 2-4周 ATM/ITM Call | 10% | 收复50%跌幅 | 支撑位破位 |
| 5 | 黄金坑 | 3月+ ITM Call | 15% | 回升原平台 | 逻辑证伪 |
| 6 | 极端转折 | 2周 OTM Put | ≤$3,000 (3%) | 回踩关键均线 | 重回均线上 |
| 7 | 利好陷阱 | 1周 ATM Call | ≤$2,000 (2%) | 次日反弹即卖 | 收盘未止跌 |
| 8 | 热点补涨 | 当周 ATM Call | 5% | 脉冲上涨即走 | 跌破5日线 |
| 9 | 财报前跑 | 当周 Call | ≤$1,500 (1.5%) | 财报前一晚必走 | 跌破日线支撑 |
| 10 | 利好钝化 | 1-2周 Call | ≤$1,000 (1%) | 脉冲即走 | 3天不动砍 |
| 11 | 财报盲盒 | 单边/跨式 | ≤$1,000 (利润1%) | 开盘30分钟 | 双杀立砍 |

*战法仅作为分类标签和执行参考，不作为唯一开仓依据。*

### 3.4 一票否决规则（硬约束）

按顺序检查，任一触发则输出对应结论：

1. **IVR 阻断**: hvIvrPercentile > 50% 且非财报博弈(距财报>5天) → "IVR偏高，风险收益比差，建议空仓"
2. **跨式拦截器**: hvIvrPercentile > 80% → 禁止跨式建仓，仅允许极小利润参与单边
3. **平庸拒止**: 无 Vol/OI 异常(volOiAnomalies为空) + 无 Squeeze/Crash 信号(均false) + ivRvSpread > 0.05(期权偏贵) → "未见极值机会，做市商占优，建议空仓"
4. **流动性否决**: Top 推荐合约 bidAskSpreadPct > 30% → 降级警告，建议换更近ATM合约
5. **无驱动源共振**: 6 大驱动源均未触发 → "当前无极端定价错误，空仓观望"

### 3.5 Insider Score（LLM 综合评分）

结合以下信号输出 0-100 分：
- 内幕交易方向/金额 (insiderTrading.summary)
- Vol/OI 异常集中度
- Strike 集中度 (strikeConcentration > 20%)
- 远期 OTM 异常集中

> 70 分标记为"疑似内幕抢跑"，纳入研判权重。

---

## Phase 4: 输出报告

严格按以下格式输出，同时保存到 `output/trade-{SYMBOL}-{EXPIRY}-{direction}.md`：

```
## {SYMBOL} {Direction} {Expiry} 交易分析

### 零、宏观环境
| 指标 | 值 | 信号 |
|------|-----|------|
| VIX | X.X | 低波/正常/恐慌/极端 |
| 10Y Yield | X.XX% | 趋势方向 |
| 信用利差 | （WebSearch） | 正常/扩大 |
| 2026周期 | Q1/Q2/Q3/Q4 | 参考 personal.md |

### 一、当前市场定性
一句话总结"情绪温差"

### 二、量化仪表盘
| 指标 | 值 | 信号 |
|------|-----|------|
| IVR (HV百分位) | X% | ✅/⚠️/🔴 |
| IVR (ATM IV百分位) | X% | |
| IV-RV Spread | ±X.XXXX | 低估/高估/合理 |
| IV Skew | ±X.XXXX | 恐慌/狂热/中性 |
| 期限结构 | ±X.XXXX | 事件溢价/正常/倒挂 |
| Expected Move | ±$X.XX (X.X%) | |
| Gamma Flip | $XXX | 距当前价 ±X.X% |
| Max Pain | $XXX | |
| P/C Ratio | X.XX | 偏多/偏空/中性 |
| BB Squeeze | 是/否 (强度X%) | 爆发前兆 |
| Gamma Squeeze Risk | 是/否 | |
| Panic Crash Risk | 是/否 | |

### 三、异常资金流（Vol/OI > 3.0）
| 行权价 | Vol/OI | 成交量 | 未平仓 | 方向 | Strike集中度 | 解读 |
（如无异常则注明"无显著异常资金流"）

### 四、正股技术面快照
- 均线: MA30/60/120 位置关系
- 布林带: 上轨/中轨/下轨 vs 当前价, BB Squeeze 状态
- RSI: 值 + 超买/超卖/中性
- MACD: 金叉/死叉/柱状图方向
- 威科夫: 阶段 + 置信度
- 关键支撑/阻力位
- OI 墙交叉验证: Call OI 墙 vs R1/R2, Put OI 墙 vs S1/S2

### 五、消息面 & 财报日历
- 距下次财报: X 天（日期）
- 近期重大新闻（1-3 条）
- 分析师评级变动
- 内幕交易: 近期高管买卖概况 + Insider Score (0-100)
- 用户补充信息（如有）

### 六、Top 3~5 推荐行权价
| 排名 | 行权价 | 期权价 | Delta | Vanna | Charm | Bid-Ask% | 盈亏平衡 | 5x目标 | P(盈利) | MC P(5x) | MC EV |
|------|--------|--------|-------|-------|-------|----------|----------|--------|---------|----------|-------|
（从 options JSON 的 top5 中选取，结合技术面和消息面调整排序）

### 七、驱动源判定 & 战法匹配
- 命中驱动源: [驱动源名称] 或 [无 → 空仓]
- 量化验证: [列出支持该决策的具体数据字段和值]
- 技术面验证: [均线/RSI/MACD/BB Squeeze 是否支持]
- 消息面验证: [新闻/财报是否支持]
- 内幕交易验证: [高管买卖方向 + Insider Score]
- 匹配战法: [战法编号+名称]
- 不利因素: [列出风险点]

### 八、最终建议
🟢 推荐买入 / 🔴 不推荐 / 🟡 观望
- 推荐行权价: $XXX
- 当前期权价: $X.XX
- 建议投入: ≤ $X,XXX（绝对值风控，参考战法仓位规则）
- 止盈策略: [具体条件]
- 止损策略: [具体条件]
- ⚠️ 风控警告（如适用：财报风险、IVR偏高、流动性不足等）
```
