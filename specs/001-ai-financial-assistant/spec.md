# Feature Specification: AI个人理财助手

**Feature Branch**: `001-ai-financial-assistant`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User description: "基于产品设计脑图实现AI个人理财助手"

## 现有资产

**stock_rich 模块** - 已实现的数据采集和分析功能

stock_rich 是一个现有的 TypeScript + Node.js 项目，已经实现了完整的市场数据采集和分析功能。在 AI 理财助手中，我们将直接复用 stock_rich 的代码，避免重复开发。

### 已实现的核心功能

**数据采集层**
- ✅ Twitter/X 采集 - 使用 rettiwt-api 采集 KOL 推文
- ✅ 微博采集 - 通过 AJAX API 采集 KOL 内容
- ✅ YouTube 采集 - RSS + 字幕采集
- ✅ 多源新闻采集 - Twitter、Reddit、Google News、Yahoo Finance、内幕交易

**数据分析层**
- ✅ 基本面分析 - 批量获取基本面数据
- ✅ 期权量化引擎 - 完整的 Black-Scholes Greeks、IVR、IV-RV Spread、IV Skew、期限结构、GEX/Gamma Flip、Monte Carlo Jump Diffusion、Max Pain 计算
- ✅ 技术指标计算 - 移动平均线、布林带、MACD、RSI 等

**工具层**
- ✅ Yahoo Finance 封装 - 包含限速、重试、期权数据获取
- ✅ 数据缓存 - OHLCV、基本面、期权数据缓存
- ✅ 日期工具 - 日期处理

### 集成方式

AI 理财助手将直接执行本地的 stock_rich 代码，通过以下方式集成：

1. **本地代码复用** - 在本地开发时，直接调用 stock_rich 目录中的 TypeScript 模块
2. **npm 包依赖** - stock_rich 将被发布为 npm 包，可以通过 npx 执行命令
3. **OpenClaw 框架集成** - 使用 OpenClaw 的 Agent + Skill 架构，通过 workspace 软链接管理各个 agent

### 架构设计

系统采用 OpenClaw 多 Agent 架构，每个 Agent 都有独立的 workspace：

**Agent 结构**：
- **financial-manager** - 主控 Agent，负责任务调度、分工和结果汇总
- **info-processor** - 信息处理 Agent，负责数据处理、记忆管理和用户偏好管理
- **macro-analyst** - 宏观分析 Agent，负责市场整体分析和热点识别
- **technical-analyst** - 技术分析 Agent，负责个股技术分析和投资建议
- **reviewer** - 复盘 Agent，负责交易结果复盘和经验总结

**Workspace 管理**：
每个 Agent 都有对应的 OpenClaw workspace，通过软链接方式管理：
- workspace-financial-manager -> ~/.openclaw/workspace-financial-manager
- workspace-info-processor -> ~/.openclaw/workspace-info-processor
- workspace-macro-analyst -> ~/.openclaw/workspace-macro-analyst
- workspace-reviewer -> ~/.openclaw/workspace-reviewer
- workspace-technical-analyst -> ~/.openclaw/workspace-technical-analyst

**项目目录结构**：
```
src/agents/
├── skills/               # 通用技能（所有 agent 共享）
│   ├── _TEMPLATE.skill.md
│   ├── analyzeMarket.skill.md
│   ├── analyzeStock.skill.md
│   ├── analyzeTradeResult.skill.md
│   ├── checkRiskLimits.skill.md
│   ├── collect.skill.md
│   ├── createTradingPlan.skill.md
│   ├── executeTrade.skill.md
│   ├── extractLessonsons.skill.md
│   ├── generateReviewReport.skill.md
│   ├── requestUserConfirmation.skill.md
│   ├── rollbackTrade.skill.md
│   ├── validateAgainstMemory.skill.md
│   ├── validateRiskControls.skill.md
│   └── validateTradeRequest.skill.md
├── workspace-financial-manager     # 软链接到 ~/.openclaw/workspace-financial-manager
├── workspace-info-processor        # 软链接到 ~/.openclaw/workspace-info-processor
├── workspace-macro-analyst        # 软链接到 ~/.openclaw/workspace-macro-analyst
├── workspace-reviewer             # 软链接到 ~/.openclaw/workspace-reviewer
└── workspace-technical-analyst    # 软链接到 ~/.openclaw/workspace-technical-analyst
```

**Agent 规范**：
每个 Agent 的 OpenClaw workspace 中必须包含：
- IDENTITY.md - Agent 的身份标识
- SOUL.md - Agent 的"灵魂/定义"文档
- USER.md - Agent 对"用户"的理解
- BOOTSTRAP.md - Agent 的启动配置
- HEARTBEAT.md - Agent 的心跳检测
- TOOLS.md - Agent 可用的工具列表

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 市场信息感知与收集 (Priority: P1) ✅ 已实现

用户需要系统能够自动收集和整理市场相关的信息，包括股票基础数据、技术分析数据、KOL观点、相关新闻和期权数据，为后续的决策分析提供全面的信息基础。

**Why this priority**: 这是整个AI理财助手的基础能力，没有准确和全面的市场信息，就无法进行有效的投资决策。这是所有后续功能的前提。

**Implementation Status**: ✅ 已在 stock_rich 中完整实现

**Independent Test**: 可以通过验证系统能够成功收集指定股票的各类数据来独立测试，并验证数据的完整性和准确性。

**Acceptance Scenarios**:

1. **Given** 用户指定了一个股票代码（如AAPL），**When** 系统执行数据收集，**Then** 系统必须返回该股票的基础信息、技术指标、相关新闻和KOL观点
2. **Given** 用户需要期权数据，**When** 系统查询期权信息，**Then** 系统必须返回期权的价格、盈亏比等关键数据
3. **Given** 数据源出现故障或超时，**When** 系统尝试收集数据，**Then** 系统必须优雅地处理错误并记录失败原因，不影响其他部分的功能

---

### User Story 2 - 投资决策分析与预案制定 (Priority: P1)

用户需要系统能够基于收集到的市场信息和个人投资认知，进行市场现状分析、个股分析和交易预案制定，包括资金管理、聚焦热点、情绪分析和板块等维度。

**Why this priority**: 这是AI理财助手的核心价值所在，通过智能化的分析帮助用户做出更明智的投资决策，减少人为判断的偏差。

**Implementation Status**: 🆕 需要实现，基于 stock_rich 提供的数据

**Independent Test**: 可以通过输入已知的市场数据和历史持仓信息，验证系统能够生成合理的交易预案和分析结论来独立测试。

**Acceptance Scenarios**:

1. **Given** 系统已收集到市场数据和个人持仓信息，**When** 用户请求投资分析，**Then** 系统必须提供市场情绪分析、板块分析和个股分析报告
2. **Given** 市场出现特定热点或机会，**When** 系统执行聚焦热点分析，**Then** 系统必须识别并推荐值得关注的投资领域
3. **Given** 用户有特定的资金管理策略，**When** 系统制定交易预案，**Then** 预案必须包含资金分配建议和风险控制措施

---

### User Story 3 - 交易执行与复盘 (Priority: P2)

用户需要系统能够执行买入、卖出和做T等交易操作，并在交易完成后进行复盘分析，记录交易结果和经验教训，用于优化未来的决策逻辑。

**Why this priority**: 这是实现投资闭环的关键环节，只有通过实际的交易执行和复盘，才能实现决策的迭代优化和投资能力的持续提升。

**Implementation Status**: 🆕 需要实现

**Independent Test**: 可以通过模拟交易环境验证系统能够正确执行交易指令并生成复盘报告来独立测试。

**Acceptance Scenarios**:

1. **Given** 系统生成了交易预案，**When** 用户确认执行，**Then** 系统必须按照预案执行买入或卖出操作
2. **Given** 交易执行完成，**When** 系统进行复盘分析，**Then** 系统必须记录交易结果、分析成功或失败的原因，并更新长期记忆
3. **Given** 市场条件发生变化，**When** 系统执行做T操作，**Then** 系统必须根据市场波动进行滚动式交易并记录操作细节

---

### User Story 4 - 长期记忆与思维迭代 (Priority: P2)

用户需要系统能够存储和检索之前的思考与判断结果，在执行新的决策时能够召回相关的历史经验，并通过复盘系统不断优化思维方式。记忆系统采用树形层级结构，支持记忆并成长。

**Why this priority**: 这是实现AI持续学习和进步的关键，通过长期记忆的积累和思维方式的迭代，系统能够提供越来越精准的投资建议。记忆并成长机制确保AI能够从历史经验中学习，不断优化决策逻辑。

**Implementation Status**: 🆕 需要实现

**Independent Test**: 可以通过验证系统能够正确存储、检索和更新历史决策记录来独立测试。

**Acceptance Scenarios**:

1. **Given** 系统完成了一次投资分析，**When** 用户保存决策结果，**Then** 系统必须将分析过程和结论存储到长期记忆中
2. **Given** 用户需要进行新的投资决策，**When** 系统执行分析，**Then** 系统必须自动召回相关的历史经验和之前的判断结果
3. **Given** 系统完成复盘分析，**When** 发现需要优化的思维方式，**Then** 系统必须更新长期记忆中的决策逻辑和经验总结
4. **Given** 多轮决策迭代后，**When** 系统积累足够的经验，**Then** 系统必须能够识别和总结有效的投资模式，实现记忆并成长
5. **Given** 记忆数据量增长时，**When** 系统执行检索，**Then** 系统必须能够在合理时间内（2秒内）返回相关记忆
6. **Given** 外部学习补充任务完成后，**When** 系统进行知识检索，**Then** 系统必须能够将新的投资知识、策略补充到长期记忆的外部学习分支
7. **Given** 交易复盘任务完成后，**When** 系统执行复盘优化，**Then** 系统必须将"做得好的经验"和"做错的教训"沉淀到长期记忆的交易复盘分支
8. **Given** 系统检测到市场数据变化（如股票数据、news更新），**When** 触发"基于外部数据再分析"任务，**Then** 系统必须及时更新记忆内容，确保时效性
9. **Given** 长期记忆数据量过大时，**When** 系统执行检索，**Then** 系统必须使用索引和缓存优化，保证检索性能在2秒内

---

### Edge Cases

- 当多个数据源返回不一致的信息时，系统如何处理冲突？
- 当市场数据缺失或延迟时，系统如何保证决策的可靠性？
- 当用户持仓信息与实际账户不一致时，系统如何同步和验证？
- 当遇到极端市场波动时，系统如何调整风险控制策略？
- 当长期记忆数据量过大时，系统如何保证检索效率？

## Requirements *(mandatory)*

### Functional Requirements

#### 市场信息感知能力 (✅ 已在 stock_rich 中实现)
- **FR-001** [✅ 已实现] System MUST 能够从多个数据源收集股票基础数据和技术分析数据
- **FR-002** [✅ 已实现] System MUST 能够获取和分析KOL（关键意见领袖）的观点和推荐
- **FR-003** [✅ 已实现] System MUST 能够收集和整理与投资标的相关的新闻资讯
- **FR-004** [✅ 已实现] System MUST 能够获取期权数据并计算盈亏比等关键指标
- **FR-005** [✅ 已实现] System MUST 能够处理数据源故障和超时，确保系统稳定性

#### 投资决策分析能力 (🆕 需要实现)
- **FR-006**: System MUST 能够进行市场情绪分析，判断市场整体趋势
- **FR-007**: System MUST 能够进行板块分析，识别热点和趋势板块
- **FR-008**: System MUST 能够进行个股分析，评估投资标的的价值和风险
- **FR-009**: System MUST 能够制定交易预案，包括买入、卖出和做T策略
- **FR-010**: System MUST 能够进行资金管理，优化资金分配和风险控制
- **FR-011**: System MUST 能够聚焦市场热点，筛选值得关注的投资机会

#### 交易执行能力 (🆕 需要实现)
- **FR-012**: System MUST 能够执行买入操作，按照预设的价格和数量下单
- **FR-013**: System MUST 能够执行卖出操作，按照预设的价格和数量平仓
- **FR-014**: System MUST 能够执行做T操作，根据市场波动进行滚动式交易
- **FR-015**: System MUST 能够记录所有交易操作的详细信息

#### 复盘与学习能力 (🆕 需要实现)
- **FR-016**: System MUST 能够对交易结果进行复盘分析，评估决策的正确性
- **FR-017**: System MUST 能够记录复盘结论和经验教训
- **FR-018**: System MUST 能够根据复盘结果优化决策逻辑和思维方式

#### 长期记忆能力 (🆕 需要实现)
- **FR-019**: System MUST 能够存储投资决策的分析过程和结论
- **FR-020**: System MUST 能够检索和召回相关的历史决策经验
- **FR-021**: System MUST 能够在执行新决策时自动加载相关的历史记忆
- **FR-022**: System MUST 能够更新和维护长期记忆，确保信息的时效性
- **FR-026**: System MUST 支持分层存储机制，包括原始数据层、决策分析层、交易复盘层和经验总结层
- **FR-027**: System MUST 能够实现记忆并成长机制，从多轮决策迭代中识别和总结有效的投资模式
- **FR-028**: System MUST 能够在记忆数据量增长时，保持检索性能在2秒内
- **FR-029**: System MUST 能够关联不同层级的记忆数据，形成完整的决策链路

#### 用户现有感知能力 (🆕 需要实现)
- **FR-023**: System MUST 能够获取用户的持仓信息
- **FR-024**: System MUST 能够获取用户的自选股列表
- **FR-025**: System MUST 能够集成用户的投资偏好和风险承受能力

### Key Entities

#### 市场数据实体 (✅ 已在 stock_rich 中定义)
- **StockData**: 表示股票的基础信息，包括代码、名称、价格、成交量等
- **TechnicalIndicator**: 表示技术分析指标，包括移动平均线、RSI、MACD等
- **MarketNews**: 表示市场新闻，包括标题、内容、来源、时间、相关股票
- **KOLView**: 表示KOL观点，包括KOL名称、观点内容、推荐标的、时间
- **OptionData**: 表示期权数据，包括合约代码、行权价、到期日、价格、盈亏比

#### 决策分析实体 (🆕 需要实现)
- **MarketAnalysis**: 表示市场分析结果，包括情绪分析、结果、板块分析结果、热点列表
- **StockAnalysis**: 表示个股分析结果，包括股票代码、分析结论、风险评估、投资建议
- **TradingPlan**: 表示交易预案，包括操作类型（买入/卖出/做T）、标的代码、价格、数量、时机、理由
- **RiskControl**: 表示风险控制措施，包括止损点、止盈点、仓位管理

#### 交易执行实体 (🆕 需要实现)
- **TradeRecord**: 表示交易记录，包括交易ID、类型、标的、价格、数量、时间、状态
- **ReviewResult**: 表示复盘结果，包括交易ID、评估结论、成功因素、失败原因、经验教训

#### 长期记忆实体 (🆕 需要实现)

**树形层级结构**：
- 根节点：长期Memory（蓝色矩形框）
- 一级分支1：Principle（原则类记忆）
  - 子节点：赚钱是第一优先级、不做毛票、妖股
- 一级分支2：外部学习促进Memory提升（外部输入类记忆）
  - 子节点：通过经典的投资书籍、股票高手分享的博文、与我Discuss
- 一级分支3：从交易复盘的闭环提升（闭环优化类记忆）
  - 子节点：收到外部信息（含股票数据、news、KOL）后分析 → 给出可执行操作结论与原因 → 某于外部数据再分析 → 生产复盘报告（含做得好的、做错的）

**数据流动逻辑**：
- 外部学习分支：数据从外部（书籍、博文、讨论）输入，直接补充到「外部学习促进Memory提升」分支，成为长期Memory的组成部分
- 交易复盘分支：数据从外部（股票数据、news、KOL信息）输入后，先经过4步闭环处理（分析→结论→再分析→复盘），最终沉淀到「从交易复盘的闭环提升」分支，更新长期Memory
- 原则分支：作为底层约束性记忆，不直接接收外部数据，但会对外部学习和交易复盘的结果进行"筛选/校准"，确保记忆内容符合投资原则

**记忆并成长的具体实现方式**：
- **外部学习补充**：定期通过阅读经典投资书籍、分析股票高手博文、与用户讨论等方式，将新的投资知识、策略补充到长期Memory中，扩展记忆的广度
- **交易复盘迭代**：建立"数据输入→分析决策→结果验证→复盘优化"的闭环流程，每完成一次交易或策略执行后，对决策过程和结果进行复盘，将"做得好的经验"和"做错的教训"沉淀到长期Memory中，提升记忆的深度和实用性

**保证记忆时效性和准确性的机制**：
- **时效性保障**：交易复盘分支设计了"过一段时间后，基于外部数据再分析"的环节，确保记忆内容能随市场变化（股票数据、news动态）及时更新，避免过时信息影响决策
- **准确性保障**：
  - 底层原则（Principle）作为"过滤器"，对所有输入和输出进行约束，确保记忆内容符合"赚钱优先""不碰毛票妖股"的原则
  - 交易复盘的"闭环提升"机制通过多次验证（分析→再分析→复盘），减少单次决策的误差，提升记忆内容的可靠性

#### 用户实体 (🆕 需要实现)
- **UserPortfolio**: 表示用户持仓，包括持仓列表、总资产、可用资金
- **Watchlist**: 表示自选股列表，包括股票代码、添加时间、关注原因
- **UserPreference**: 表示用户偏好，包括风险承受能力、投资风格、目标收益

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户能够在5分钟内获得完整的市场信息分析报告，包括股票数据、KOL观点和相关新闻
- **SC-002**: 系统能够在市场数据更新后1分钟内完成情绪分析和热点识别
- **SC-003**: 90%的交易预案能够在市场条件符合时成功执行
- **SC-004**: 复盘分析能够在交易完成后10分钟内完成并生成经验总结
- **SC-005**: 长期记忆的检索响应时间不超过2秒
- **SC-006**: 系统的数据收集成功率不低于95%（排除数据源故障）
- **SC-007**: 用户对系统提供的投资建议的采纳率达到60%以上
- **SC-008**: 通过系统的辅助，用户的投资决策时间减少50%
- **SC-009**: 系统能够支持至少100个股票的实时监控和分析
- **SC-010**: 长期记忆的积累使得系统在3个月后的决策准确率提升20%

---

## Clarifications

### Session 2026-03-11

- Q: stock_rich 的集成方式是什么？ → A: 在本地执行时，直接执行本地的stock_rich代码，虽然stock_rich代码会被发布成npm包，可以通过npx执行命令
- Q: AI理财助手应该实现哪些新功能？ → C: 实现决策、执行、复盘、长期记忆，并增强stock_rich
- Q: AI理财助手的整体技术架构是什么？ → A: OpenClaw + TypeScript + Node.js
- Q: 长期记忆机制应该如何设计？ → 用户指出记忆应该有分层存储和总结机制，支持记忆并成长。已在规格说明中更新用户故事4、长期记忆能力需求和关键实体定义，明确说明了树形层级结构（原始数据层、决策分析层、交易复盘层、经验总结层）和记忆并成长机制。
