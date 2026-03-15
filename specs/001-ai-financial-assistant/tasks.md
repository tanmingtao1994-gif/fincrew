# 任务清单：AI 个人理财助手（Multi‑Agent + Skills）

功能：AI个人理财助手  
分支：001-ai-financial-assistant

说明：
- 架构遵循 plan.md：Multi‑Agent 与共享 Skills；无独立 tools 层；Skills 通过 Node 调用 stock_rich。
- 任务按阶段与用户故事（US）组织；严格使用清单格式与文件路径。

---

## 阶段 1：初始化（Setup）

- [ ] T001 在仓库根创建顶层目录（agents/、skills/）于 /Users/bytedance/projects/ai/financial-agent
- [ ] T002 在 agents/ 添加占位 .gitkeep 以跟踪目录于 /Users/bytedance/projects/ai/financial-agent/agents/.gitkeep
- [ ] T003 在 skills/ 添加占位 .gitkeep 以跟踪目录于 /Users/bytedance/projects/ai/financial-agent/skills/.gitkeep
- [ ] T004 [P] 新建 Skill 模板头部与使用规范于 /Users/bytedance/projects/ai/financial-agent/skills/_TEMPLATE.skill.md
- [ ] T005 定义 stock_rich 的 Node 调用示例于 /Users/bytedance/projects/ai/financial-agent/skills/collect.skill.md
- [ ] T006 在 AGENTS.md 的 “Project Structure” 中加入 agents/ 与 skills/ 于 /Users/bytedance/projects/ai/financial-agent/AGENTS.md

## 阶段 2：基础（Foundational，阻塞所有 US）

- [ ] T007 编写 Manager Agent 清单（角色、路由）于 /Users/bytedance/projects/ai/financial-agent/agents/manager/README.md
- [ ] T008 [P] 编写 Info Processor Agent 骨架（soul/memory/user）于 /Users/bytedance/projects/ai/financial-agent/agents/info-processor/README.md
- [ ] T009 [P] 编写 Technical Analyst Agent 骨架于 /Users/bytedance/projects/ai/financial-agent/agents/technical-analyst/README.md
- [ ] T010 [P] 编写 Macro Analyst Agent 骨架于 /Users/bytedance/projects/ai/financial-agent/agents/macro-analyst/README.md
- [ ] T011 [P] 编写 Reviewer Agent 骨架于 /Users/bytedance/projects/ai/financial-agent/agents/reviewer/README.md
- [ ] T012 提供 .env.example（对接 stock_rich 所需配置）于 /Users/bytedance/projects/ai/financial-agent/.env.example

---

## 阶段 3：[US2] 投资决策分析与预案（P1）

- [ ] T013 [US2] 定义 analyzeMarket Skill（调用 stock_rich 收集/分析）于 /Users/bytedance/projects/ai/financial-agent/skills/analyzeMarket.skill.md
- [ ] T014 [P] [US2] 定义 analyzeStock Skill（按标的聚合 technical/options/news）于 /Users/bytedance/projects/ai/financial-agent/skills/analyzeStock.skill.md
- [ ] T015 [P] [US2] 定义 createTradingPlan Skill（仓位、止损/止盈）于 /Users/bytedance/projects/ai/financial-agent/skills/createTradingPlan.skill.md
- [ ] T016 [P] [US2] 定义 validateRiskControls Skill（阈值检查、组合约束）于 /Users/bytedance/projects/ai/financial-agent/skills/validateRiskControls.skill.md
- [ ] T017 [US2] 在 Technical Analyst Agent 中编排上述 Skills 于 /Users/bytedance/projects/ai/financial-agent/agents/technical-analyst/README.md
- [ ] T018 [US2] 在 Manager Agent 中增加 US2 路由路径于 /Users/bytedance/projects/ai/financial-agent/agents/manager/README.md
- [ ] T019 [US2] 补充 US2 验收清单于 /Users/bytedance/projects/ai/financial-agent/specs/001-ai-financial-assistant/tasks-acceptance-US2.md

独立测试标准（US2）：
- 给定市场与组合数据，执行 analyzeMarket → analyzeStock → createTradingPlan，产生目标标的的分析结果与交易预案文档。

---

## 阶段 4：[US3] 交易执行与复盘（P2）

- [ ] T020 [US3] 定义 validateTradeRequest Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/validateTradeRequest.skill.md
- [ ] T021 [P] [US3] 定义 checkRiskLimits Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/checkRiskLimits.skill.md
- [ ] T022 [P] [US3] 定义 validateAgainstMemory Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/validateAgainstMemory.skill.md
- [ ] T023 [P] [US3] 定义 requestUserConfirmation Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/requestUserConfirmation.skill.md
- [ ] T024 [US3] 定义 executeTrade Skill（优先 dry‑run）于 /Users/bytedance/projects/ai/financial-agent/skills/executeTrade.skill.md
- [ ] T025 [P] [US3] 定义 rollbackTrade Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/rollbackTrade.skill.md
- [ ] T026 [US3] 定义 analyzeTradeResult Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/analyzeTradeResult.skill.md
- [ ] T027 [P] [US3] 定义 extractLessons Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/extractLessons.skill.md
- [ ] T028 [P] [US3] 定义 generateReviewReport Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/generateReviewReport.skill.md
- [ ] T029 [US3] 在 Reviewer Agent 中编排复盘流水线于 /Users/bytedance/projects/ai/financial-agent/agents/reviewer/README.md
- [ ] T030 [US3] 在 Manager Agent 中增加执行流路由于 /Users/bytedance/projects/ai/financial-agent/agents/manager/README.md

独立测试标准（US3）：
- 给定交易预案与用户确认，执行 validate → execute（dry‑run）→ analyze result → 生成 Markdown 复盘报告。

---

## 阶段 5：[US4] 长期记忆（P2）

- [ ] T031 [US4] 定义 storeMemory Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/storeMemory.skill.md
- [ ] T032 [P] [US4] 定义 retrieveMemory Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/retrieveMemory.skill.md
- [ ] T033 [P] [US4] 定义 rebuildIndex Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/rebuildIndex.skill.md
- [ ] T034 [P] [US4] 定义 updateMemoryEffectiveness Skill 于 /Users/bytedance/projects/ai/financial-agent/skills/updateMemoryEffectiveness.skill.md
- [ ] T035 [US4] 在 Info Processor Agent（memory）中编排记忆相关流程于 /Users/bytedance/projects/ai/financial-agent/agents/info-processor/README.md
- [ ] T036 [US4] 在 Manager Agent 中增加记忆相关路由于 /Users/bytedance/projects/ai/financial-agent/agents/manager/README.md

独立测试标准（US4）：
- 给定分析或复盘结果，能写入记忆节点、在 2 秒内检索相关记忆，并基于反馈更新有效性。

---

## 最终阶段：打磨与横切关注点（Polish）

- [ ] T037 为各 US 编写并行运行示例于 /Users/bytedance/projects/ai/financial-agent/specs/001-ai-financial-assistant/parallel-examples.md
- [ ] T038 校对配置文档与 .env.example 一致性于 /Users/bytedance/projects/ai/financial-agent/specs/001-ai-financial-assistant/quickstart.md
- [ ] T039 在 _TEMPLATE.skill.md 增加性能护栏（timeout/retry）于 /Users/bytedance/projects/ai/financial-agent/skills/_TEMPLATE.skill.md
- [ ] T040 更新 plan.md 的依赖关系/顺序说明于 /Users/bytedance/projects/ai/financial-agent/specs/001-ai-financial-assistant/plan.md

---

## 依赖关系（用户故事顺序）

1）US2（Decision Analysis & Planning）→ 2）US3（Execution & Review）→ 3）US4（Long‑Term Memory）

- 阶段 1 与阶段 2 完成后，才可进入 US2/US3/US4。
- US1（Collection）已在 stock_rich 中实现；此处以 Skills 包装调用。

## 并行执行示例

- US2：T014、T015、T016 可在 T013 完成后并行；T017、T018 在技能就绪后执行。
- US3：T021、T022、T023 可在 T020 后并行；T025、T027、T028 在 T024/T026 完成后执行。
- US4：T032、T033、T034 可在 T031 后并行。

---

## 补充阶段：Agent 基线与协同机制

（以下任务编号延续现有清单，避免影响已排期项）

- [ ] T041 为 manager 创建 soul.md 于 /Users/bytedance/projects/ai/financial-agent/agents/manager/soul.md
- [ ] T042 [P] 为 manager 创建 memory.md 于 /Users/bytedance/projects/ai/financial-agent/agents/manager/memory.md
- [ ] T043 [P] 为 manager 创建 user.md 于 /Users/bytedance/projects/ai/financial-agent/agents/manager/user.md

- [ ] T044 为 info-processor 创建 soul.md 于 /Users/bytedance/projects/ai/financial-agent/agents/info-processor/soul.md
- [ ] T045 [P] 为 info-processor 创建 memory.md 于 /Users/bytedance/projects/ai/financial-agent/agents/info-processor/memory.md
- [ ] T046 [P] 为 info-processor 创建 user.md 于 /Users/bytedance/projects/ai/financial-agent/agents/info-processor/user.md

- [ ] T047 为 technical-analyst 创建 soul.md 于 /Users/bytedance/projects/ai/financial-agent/agents/technical-analyst/soul.md
- [ ] T048 [P] 为 technical-analyst 创建 memory.md 于 /Users/bytedance/projects/ai/financial-agent/agents/technical-analyst/memory.md
- [ ] T049 [P] 为 technical-analyst 创建 user.md 于 /Users/bytedance/projects/ai/financial-agent/agents/technical-analyst/user.md

- [ ] T050 为 macro-analyst 创建 soul.md 于 /Users/bytedance/projects/ai/financial-agent/agents/macro-analyst/soul.md
- [ ] T051 [P] 为 macro-analyst 创建 memory.md 于 /Users/bytedance/projects/ai/financial-agent/agents/macro-analyst/memory.md
- [ ] T052 [P] 为 macro-analyst 创建 user.md 于 /Users/bytedance/projects/ai/financial-agent/agents/macro-analyst/user.md

- [ ] T053 为 reviewer 创建 soul.md 于 /Users/bytedance/projects/ai/financial-agent/agents/reviewer/soul.md
- [ ] T054 [P] 为 reviewer 创建 memory.md 于 /Users/bytedance/projects/ai/financial-agent/agents/reviewer/memory.md
- [ ] T055 [P] 为 reviewer 创建 user.md 于 /Users/bytedance/projects/ai/financial-agent/agents/reviewer/user.md

- [ ] T056 定义 Manager 审核流程（状态机、门禁、反馈模板）于 /Users/bytedance/projects/ai/financial-agent/agents/manager/README.md
- [ ] T057 [P] 在各 Agent README.md 链入“提交/回收”章节于 /Users/bytedance/projects/ai/financial-agent/agents/*/README.md
- [ ] T058 在 plan.md 中补充“协同与审核机制”落地检查表于 /Users/bytedance/projects/ai/financial-agent/specs/001-ai-financial-assistant/plan.md

并行策略：
- T042–T043、T045–T046、T048–T049、T051–T052、T054–T055 可并行；T056–T058 须在基础文件创建后执行。

验收标准：
- 各 Agent 目录均存在 soul.md / memory.md / user.md，内容包含“目的、输入/输出、依赖、更新策略、引用规范”。
- Manager 审核 SOP 可支撑 assigned→in_progress→submit_review→manager_review→done/rework 全流程，且子 Agent 能据此循环改进。
