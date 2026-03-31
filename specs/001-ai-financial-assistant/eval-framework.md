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
  │    ├── info_processor.json       # 针对信息处理Agent的测试用例集(Array形式)
  │    ├── financial_manager.json    # 针对经理的测试用例集
  │    └── ...
  ├── workflow/                      # 协同级评测集
  │    └── ...
```

### B. 评测过程数据存储 (LLM Invoke Results)
由 `eval-runner.ts` 驱动，执行完后将抓取的 session 按执行时间戳保存至 `tests/llm_invoke_results/<timestamp>/`。
这只是包含中间对话记录的 Raw 数据，不包含判断结果。

### C. 评测对比与打分逻辑 (Evaluation Engine)
由 `eval-compare.ts` (类似 promptfoo) 驱动，读取 `llm_invoke_results` 的结果。
在比对后，最终生成的**可视化的测评报告**，将被存储于 `tests/eval_results/<timestamp>/report.md`。

1.  **硬性规则比对 (Hard Rules):** 
    通过解析 JSONL 找到所有 ToolCalls 和 Assistant 的文本，根据 Dataset 里的 `expected_behavior` 进行断言：
    *   `must_call`: 断言必须调用过指定的 tool。
    *   `must_contain`: 断言输出文本中包含了预期关键词。
    *   `must_reject`: 断言未调用 executeTrade 或输出了明显的拒绝动作。
2.  **LLM-as-a-Judge (大模型裁判模型比对) [未来扩展]:**
    对于生成的自然语言分析报告，引入外部模型对比 `llm_invoke_results` 和真实的 Mock 数据。

---

## 3. 落地步骤与指令

1.  **准备或运行数据收集**: 
    ```bash
    npm run eval -- --target single_agent/info_processor
    ```
    执行后，会在 `tests/llm_invoke_results/` 生成对应的时间戳和 session.jsonl 文件。
2.  **执行评测并生成报告**: 
    ```bash
    npm run eval:compare
    ```
    该指令会读取最新一次 `llm_invoke_results` 的执行结果，执行各类断言比对，并将最终评测报告输出至 `tests/eval_results/` 对应的时间戳目录下。
3.  **全量执行 (一键评测)**:
    ```bash
    npm run eval:all
    ```