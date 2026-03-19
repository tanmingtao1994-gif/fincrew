# AI Financial Agent 评测能力设计方案 (Evaluation Framework)

## 概述

为了确保多 Agent 协同体系在真实金融决策场景中的稳定性、指令遵从度及策略有效性，需要一套全面的大模型评测方案。传统的单元测试仅能保证 API 与代码语法逻辑正确，而在 AI 场景中，更需要关注“决策质量”、“Agent 行为符合度”以及“执行过程的可追溯性”。

本方案去掉了传统的单一 Skill 测试（如不单独测试 `collect` 代码逻辑），而是将 Skill 的执行能力融入到对应 Agent 在特定场景下的真实调用中进行验证。

---

## 1. 评测分层架构与场景设计

评测主要分为 **单体代理级 (Agent Level)** 和 **工作流/协同级 (Workflow Level)**。

### A. 单体代理级评测 (Agent Level)
**目标：** 验证单个 OpenClaw Workspace 中 Agent 的 Prompt (SOUL.md / IDENTITY.md) 约束能力，角色扮演是否到位，以及该 Agent 专属工具（Skill）调用是否符合预期。

*   **Info Processor (信息处理 Agent) - 场景集：**
    *   **场景 1：降噪与提纯 (Noise Reduction)**
        *   *测试内容：* 给出一段混合了大量无关社交平台聊天与极少关键数据的文本，测试其提取“关键基本面数据”的召回率。
    *   **场景 2：主动信息采集 (Proactive Collection)**
        *   *测试内容：* 用户给出泛泛的指令（如“收集今天关于 NVDA 的市场观点”），评测该 Agent 是否能准确调用 `collect` 等获取原始数据。
*   **Technical / Macro Analyst (技术/宏观分析 Agent) - 场景集：**
    *   **场景 3：逻辑一致性与数据归因 (Logic Consistency)**
        *   *测试内容：* 给定确定的看跌行情数据（如 MACD 死叉，连续大跌数据喂入），评测其生成的分析报告是否合理，严禁出现“强烈买入”等违背事实的结论，并且分析中引用的数据必须来源于提供的原始数据（避免幻觉）。
*   **Financial Manager (基金经理 Agent) - 场景集：**
    *   **场景 4：风控边界测试 (Risk Control Boundary)**
        *   *测试内容：* 强行下发包含超限金额（如超过账户 50% 仓位）的模拟交易意图，测试其在调用 `validateRiskControls` 或 `checkRiskLimits` 后，是否能准确拦截并抛出拒绝理由。
    *   **场景 5：格式与计划遵从度 (Format Compliance)**
        *   *测试内容：* 验证其最终输出的交易计划（Trading Plan）是否严格遵循预设的 JSON 格式。

### B. 协同与工作流评测 (Workflow Level)
**目标：** 评估整个系统的黑盒表现（端到端能力），即从“接收指令”到“输出最终交易决策和复盘报告”的整体链路。

*   **场景 6：多代理一致性协商 (Agent Consensus)**
    *   *测试内容：* 注入冲突数据（如 Macro Agent 根据宏观面看空，Technical Agent 根据技术面看多），评测 Financial Manager 是否能合理地结合两者给出“中性/观望”或者“通过期权对冲”的折中结论。
*   **场景 7：记忆反思闭环 (Memory & Reflection)**
    *   *测试内容：* 
        1. 注入历史亏损交易数据，触发 `extractLessons` 和 `storeMemory` 生成教训。
        2. 第二次喂入相同特征的高危市场环境。
        3. 评测系统是否能在新决策链路中因为触发 `validateAgainstMemory` 而成功预警或拦截该交易。

---

## 2. 评测执行架构与 Session 追踪机制

要实现以上评测，必须有一套自动化和标准化的环境来进行**数据回放**和**过程抓取**。

### A. 评测数据集 (Benchmark Dataset) 结构
数据集需要明确分类，并在物理文件上按类别隔离。建议在工程根目录建立 `tests/eval_dataset/`：

```text
tests/eval_dataset/
  ├── single_agent/                  # 单体Agent评测集
  │    ├── info_processor_noise.json # 对应场景1的输入文本和期望
  │    ├── macro_bear_market.json    # 对应场景3的宏观崩盘数据
  │    └── ...
  ├── workflow/                      # 协同级评测集
  │    ├── conflict_signals.json     # 对应场景6
  │    ├── memory_loop.json          # 对应场景7
  │    └── ...
  └── mocks/                         # 用于替换真实网络的 Mock 桩数据
       └── data/daily/2026-03-xx/    # 注入的虚拟日期市场数据快照
```
每个 `.json` 配置文件应包含：
*   `test_id`: 用例唯一标识
*   `agent_target`: 测试目标 Agent（或 Workflow）
*   `input_prompt`: 模拟用户的输入指令
*   `mock_date`: 需要注入的时间上下文（如锁定为 2026-01-01）
*   `expected_behavior`: 预期行为（如“must_call: collect”, “must_reject: true”）

### B. 评测过程数据存储 (Session Storage)
OpenClaw 框架在运行中会产生复杂的思维链和工具调用，评测脚本必须将这些过程数据完整录制下来，以便与评测数据做比对。

1.  **Session ID 注入:** 每次执行一个评测 Case，`eval-runner` 脚本都会生成一个唯一的 UUID 作为 `eval_session_id`。
2.  **过程快照目录:** 在 `tests/eval_results/<eval_session_id>/` 下保存该次运行的所有黑盒输入输出：
    *   `messages.log`: 记录 OpenClaw Agent 间交互的所有原始 Message。
    *   `tool_calls.json`: 记录此次 Session 中 Agent 调用了哪些 Tool，传入了什么参数，Tool 返回了什么结果。
    *   `final_output.md`: Agent 最终输出给用户的回答。

### C. 评测对比与打分逻辑 (Evaluation Engine)
在收集完 Session 数据后，如何进行评测对比？

1.  **硬性规则比对 (Hard Rules):** 
    读取 `tool_calls.json`，根据 Benchmark 里的 `expected_behavior` 进行断言。
    *   *例：如果预期是测试风控拦截，就断言 `tool_calls.json` 中必须出现 `validateRiskControls`，并且最终 `messages.log` 中包含“拒绝”或“超限”等关键词。*
2.  **LLM-as-a-Judge (大模型裁判模型比对):**
    对于生成的自然语言分析报告，传统的断言无效。此时调用外部低成本模型（如 GPT-4o-mini）。
    *   *Prompt 示例给裁判模型：* “这是系统生成的技术分析报告 `final_output.md`。这是底层的原始输入数据 `mock_date` 的 `stockdata.json`。请检查报告中引用的各项数据是否有捏造（幻觉），请回答 PASS 或 FAIL，并附上理由。”

---

## 3. 落地步骤

1.  **第一步（建设基建）：** 开发 `scripts/run-eval.ts`，实现能根据 `eval_dataset` 里的某一个 JSON 文件，自动起一个 OpenClaw 实例，强行注入 mock 数据，并把执行的 log 落盘到 `tests/eval_results` 中。
2.  **第二步（撰写用例）：** 优先编写一个 `Financial Manager 风控拦截` 的单一 Agent 测试用例。
3.  **第三步（加入裁判）：** 引入 LLM-as-a-Judge 脚本，读取上一步的落盘文件，输出自动化评分。
4.  **第四步（CI 整合）：** 所有的用例串联，配置入 package.json 中的 `npm run test:eval`。