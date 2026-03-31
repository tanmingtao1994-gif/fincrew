# Feature Specification: Eval Results Viewer

**Feature Branch**: `002-eval-results-viewer`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "新建一个功能：我希望能像promptfoo view一样:custom-example-view-9ae23455472278ef61a08c3156f75093.png，能看到汇总的list数据，同时每一条用例数据点击详情，可以看到llm的具体调用。展示llm的具体调用时，能按照role，content.type，内容区分开每条内容的展示方式，做到清晰。 评测的数据来自于：/Users/bytedance/projects/ai/financial-agent/tests. eval_dataset是用例描述，eval_results是评测结果, llm_invoke_results是实际llm的调用过程数据 . 继续调整specs 002"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Evaluation Summary List (Priority: P1)

作为开发人员或测试人员，我希望能够打开一个 Web 视图，在首页看到所有的评测执行历史或评测用例的汇总列表，以便我能快速了解整体的评测结果和通过率。列表中的用例信息应该结合用例的原始描述以及评测的执行结果。

**Why this priority**: 核心的入口和概览，用户必须先看到汇总数据才能深入了解细节。

**Independent Test**: 可以启动本地服务，通过浏览器访问并在页面上正确显示从系统读取到的测试用例结果（包括成功/失败状态、执行时间、名称等字段）。

**Acceptance Scenarios**:

1. **Given** 系统中的 `tests` 目录下已有 `eval_dataset`（用例描述）和 `eval_results`（评测结果）数据，**When** 用户访问 viewer 首页，**Then** 页面展示一个清晰的列表，包含所有用例的摘要信息（状态、名称、耗时等）以及对应的用例描述。
2. **Given** 没有任何评测结果，**When** 用户访问 viewer 首页，**Then** 页面给出友好的空状态提示。

---

### User Story 2 - View Specific Case Details and LLM Invocations (Priority: P1)

作为开发人员，我希望在点击某条测试用例的详情后，能够完整看到该用例的详细描述，以及它在执行过程中与大模型 (LLM) 的所有对话交互记录，以便我能追踪问题或确认模型的思考过程。

**Why this priority**: 提供评测平台最核心的调试价值，是 promptfoo view 体验的核心。

**Independent Test**: 能够解析并展示复杂的交互记录，点击特定条目能进入详细页面。

**Acceptance Scenarios**:

1. **Given** 用户在列表页，**When** 用户点击某条包含 LLM 调用的用例记录，**Then** 页面跳转/弹出侧边栏展示该用例的具体详情，包含用例基础信息（来自 `eval_dataset`）和详细的执行记录（来自 `llm_invoke_results`）。
2. **Given** 展示用例详情，**When** 包含多轮 LLM 调用，**Then** 页面按照交互顺序展示所有对话。

---

### User Story 3 - Distinct Visual Presentation of Dialogue Elements (Priority: P2)

作为开发人员，在查看 LLM 具体调用时，我希望页面能够根据消息的 Role（如 user, assistant, system, tool）以及 Content Type（如 text, thinking, toolCall, toolResult）采用不同的颜色、图标或排版样式来进行区分，确保信息的清晰可读。

**Why this priority**: 对于动辄几千 token 的 LLM 对话，高度结构化和差异化的视觉排版是决定可用性的关键。

**Independent Test**: 提供一份包含各种复杂元素（文本、思考过程、工具调用、工具返回）的模拟数据进行渲染测试，人工校验每种元素的 UI 样式是否有明显区分。

**Acceptance Scenarios**:

1. **Given** LLM 记录中包含 `role="user"` 和 `role="assistant"` 的信息，**When** 在页面中渲染时，**Then** user 和 assistant 的消息使用不同的背景色或左右气泡布局。
2. **Given** assistant 的回复中包含 `thinking` 过程和 `toolCall`，**When** 在页面中渲染时，**Then** 思考过程可能以折叠面板或不同的灰色背景展示，工具调用有明确的代码块或特殊区块展示。
3. **Given** 收到 `toolResult`（工具执行结果），**When** 在页面中渲染时，**Then** 工具结果应该与对应的工具调用相匹配，并在视觉上表现为系统输出或 JSON 代码块样式。

### Edge Cases

- 当 LLM 调用的返回内容非常长（例如网页抓取的几万字结果）时，页面是否会卡顿？应当如何处理（截断或限制高度折叠）？
- 某条记录可能存在 `eval_results` 数据，但缺少对应的 `llm_invoke_results` 或 `eval_dataset`，系统应当优雅降级，展示可用数据。
- 如果 JSONL/JSON 记录中出现了解析错误的断行数据或格式错误，是否会导致整个详情页崩溃？页面应当捕获错误并提示，不影响其他数据的展示。

## Requirements *(mandatory)*

### Assumptions

- `tests` 目录下，`eval_dataset`、`eval_results`、`llm_invoke_results` 的数据可以通过某种共有标识（例如文件命名规则中的 timestamp 或内容中的 `test_id`）进行一对一的匹配与关联。
- 数据文件主要为 JSON 或 JSONL 格式。

### Functional Requirements

- **FR-001**: System MUST 提供一个本地 HTTP 服务和 Web 前端界面，用于可视化评测结果（类似 `promptfoo view`）。
- **FR-002**: System MUST 能从指定的 `tests` 目录读取数据源，包括：解析 `eval_dataset` 获取用例描述，解析 `eval_results` 获取评测结果，解析 `llm_invoke_results` 获取实际的 LLM 调用过程数据。
- **FR-003**: System MUST 根据用例的唯一标识（如 test_id）将用例描述、评测结果、LLM 调用日志进行关联和拼接。
- **FR-004**: System MUST 在列表页展示每次执行 (Run) 的总结以及每个用例的概况和基本描述。
- **FR-005**: System MUST 为每一个用例提供详情视图。
- **FR-006**: System MUST 在详情视图中按照时间顺序还原完整的消息记录流。
- **FR-007**: System MUST 根据 `role`（user/assistant/toolResult 等）对消息流进行视觉区分。
- **FR-008**: System MUST 能够解析 `content` 中的多模态类型结构（如 `text`、`thinking`、`toolCall`），并对它们分别应用不同的 UI 组件或样式。
- **FR-009**: System MUST 支持在启动 viewer 时通过配置文件或命令行参数指定 `tests` 数据的根目录路径，默认指向当前项目的 `tests` 目录。

### Key Entities

- **EvalRun**: 一次评测执行批次，包含 timestamp, total, passed, failed。
- **TestCase**: 单个评测用例的基础信息，对应 `eval_dataset`，包含 test_id, name, description, expected_behavior。
- **TestResult**: 单个评测用例的执行结果，对应 `eval_results`，包含 test_id, status, score, judge_reason, duration。
- **LLMInvocation**: 交互日志中的调用记录集合，对应 `llm_invoke_results`，包含一系列的 LLMMessage。
- **LLMMessage**: 交互日志中的一条消息，核心字段：role, content (array of sub-elements), timestamp。
- **MessageContent**: 消息内部的具体段落，包含 type ('text' | 'thinking' | 'toolCall'), text, name, arguments。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 开发者可以通过一条简单的命令（例如 `npm run view` 或指定脚本）在 5 秒内启动本地 Web 服务并自动或提示打开浏览器。
- **SC-002**: Web 界面能正确读取本地存在的至少 10 份历史评测记录，并将 `eval_dataset`、`eval_results`、`llm_invoke_results` 的数据成功关联渲染，且列表页渲染时间低于 1 秒。
- **SC-003**: 在 LLM 对话展示界面，文本、思考过程 (thinking)、工具调用 (toolCall)、工具返回结果 (toolResult) 100% 能够被单独区分并具备不同样式。
- **SC-004**: 即使某一目录的数据缺失（如无对应的 `llm_invoke_results`），其余数据也能正确展示。
- **SC-005**: 超长文本的工具返回结果（大于 2000 字符）默认限制展示高度，不破坏页面整体滚动体验。
