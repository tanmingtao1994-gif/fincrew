---

description: "Task list for implementing Eval Results Viewer"
---

# Tasks: Eval Results Viewer

**Input**: Design documents from `/specs/002-eval-results-viewer/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths are included in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the CLI tool and Vite SPA

- [x] T001 Create `eval-view.ts` CLI script entry point
- [x] T002 Initialize `ui/` directory with Vite + React + TypeScript setup
- [x] T003 [P] Configure Tailwind CSS in `ui/` project
- [x] T004 [P] Update root `package.json` to include `"view": "npx tsx eval-view.ts"` script

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data parsing and serving infrastructure that MUST be complete before UI user stories can be implemented

- [x] T005 Create data model TypeScript interfaces in `ui/src/types.ts`
- [x] T006 Implement test data file reading logic (`eval_dataset`, `eval_results`, `llm_invoke_results`) in `eval-view.ts`
- [x] T007 Implement data joining logic to assemble `TestCase` and `EvalRun` data in `eval-view.ts`
- [x] T008 Implement local Vite server startup logic in `eval-view.ts` to serve the `ui/` app and provide the merged JSON payload

**Checkpoint**: Foundation ready - local CLI can read data and serve the Vite app.

---

## Phase 3: User Story 1 - View Evaluation Summary List (Priority: P1) 🎯 MVP

**Goal**: 展示所有评测执行历史或评测用例的汇总列表。

**Independent Test**: 运行 `npm run view`，浏览器打开后能看到一个列表，包含从 `tests` 读取的摘要信息（状态、名称、耗时、描述）。

### Implementation for User Story 1

- [x] T009 [US1] Create API fetching/mocking wrapper to consume data injected by CLI in `ui/src/api.ts`
- [x] T010 [P] [US1] Implement `SummaryList` component in `ui/src/components/SummaryList.tsx`
- [x] T011 [P] [US1] Implement `TestCaseRow` component in `ui/src/components/TestCaseRow.tsx`
- [x] T012 [US1] Assemble list view page in `ui/src/pages/HomePage.tsx`
- [x] T013 [US1] Integrate `HomePage` into `ui/src/App.tsx` router/layout

**Checkpoint**: At this point, User Story 1 should be fully functional (Summary List displays).

---

## Phase 4: User Story 2 - View Specific Case Details and LLM Invocations (Priority: P1)

**Goal**: 点击用例后展示详细描述和 LLM 交互记录。

**Independent Test**: 在列表页点击一个记录，页面能够加载并显示出包含多轮对话的详细日志流水。

### Implementation for User Story 2

- [x] T014 [US2] Update `ui/src/api.ts` to fetch/filter specific `LLMInvocation` details by `test_id`
- [x] T015 [P] [US2] Create basic `MessageList` layout component in `ui/src/components/MessageList.tsx`
- [x] T016 [P] [US2] Create `DetailViewPage` in `ui/src/pages/DetailViewPage.tsx`
- [x] T017 [US2] Implement navigation (React Router or state-based) from `TestCaseRow` to `DetailViewPage` in `ui/src/App.tsx`

**Checkpoint**: At this point, clicking a row navigates to a details page displaying raw message flow.

---

## Phase 5: User Story 3 - Distinct Visual Presentation of Dialogue Elements (Priority: P2)

**Goal**: 根据 Role 和 Content Type 对消息进行差异化、结构化的视觉展示（如代码块、折叠思考过程）。

**Independent Test**: 提供复杂的模拟日志数据，页面能清晰渲染 user/assistant 的不同气泡，正确解析 Markdown，并将 `toolCall` 和 `toolResult` 用特定样式高亮/限制高度。

### Implementation for User Story 3

- [x] T018 [P] [US3] Add `react-markdown` dependency and configure in `ui/`
- [x] T019 [US3] Implement role-based (user/assistant) styling wrapper `MessageBubble` in `ui/src/components/MessageBubble.tsx`
- [x] T020 [P] [US3] Implement `ThinkingBlock` component (collapsible) in `ui/src/components/ThinkingBlock.tsx`
- [x] T021 [P] [US3] Implement `ToolCallBlock` and `ToolResultBlock` (with max-height) in `ui/src/components/ToolBlocks.tsx`
- [x] T022 [US3] Update `MessageList.tsx` to map `content.type` to the newly created specific blocks

**Checkpoint**: All user stories should now be independently functional. The UI should look polished and distinct.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and error handling

- [x] T023 Handle edge case: graceful fallback in `eval-view.ts` when `llm_invoke_results` directory is missing
- [x] T024 Handle edge case: graceful fallback in UI when JSON parsing fails for a specific test case
- [x] T025 Validate and format `quickstart.md` execution flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: Depend on Foundational phase completion. Must execute in priority order (P1 -> P1 -> P2).

### Implementation Strategy

#### Incremental Delivery
1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Verify list renders with local data
3. Add User Story 2 -> Verify navigation to raw detail view
4. Add User Story 3 -> Verify rich UI components for complex logs
