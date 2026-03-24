# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个类似 promptfoo view 的本地 Web 可视化工具。后端使用 Node.js (Express) 读取并解析本地 `tests` 目录下的多源文件（评测描述、结果、LLM日志），前端使用 React 渲染列表和详情页，着重区分并格式化多模态的 LLM 对话日志（文本、思考过程、工具调用等）。

## Technical Context

**Language/Version**: TypeScript / Node.js 18+ (Backend), React (Frontend)
**Primary Dependencies**: Express (Backend), Tailwind CSS & react-markdown (Frontend)
**Storage**: Local JSON/JSONL files (Read-only)
**Testing**: Jest or Vitest
**Target Platform**: Local developer environment
**Project Type**: Local Web application (Fullstack monorepo style script/tool)
**Performance Goals**: Startup < 5s, List render < 1s
**Constraints**: Zero database dependencies, must handle large toolResult texts gracefully
**Scale/Scope**: Local scoped, handles hundreds of test cases and corresponding JSONL logs smoothly

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Atomicity**: The backend API endpoints and frontend components are designed with single responsibilities (e.g., separate parsing logic from routing).
- **Interface Contract**: Strict TypeScript interfaces will be defined for `TestCase`, `EvalRun`, and `LLMMessage` shared between frontend and backend.
- **Dependency Inversion**: No circular dependencies. The data parsing layer will be abstracted from the Express routing layer.
- **Exception Propagation**: The backend will return structured JSON error responses that the frontend can display gracefully (e.g., when `llm_invoke_results` are missing).
- **Documented Code**: Core parsers and UI components will include JSDoc.
- **Language Presentation**: UI and documentation will use Chinese, while code identifiers and APIs use English.

## Project Structure

### Documentation (this feature)

```text
specs/002-eval-results-viewer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application
viewer/
├── backend/
│   ├── src/
│   │   ├── parser/      # Reads and joins local files
│   │   ├── api/         # Express routes
│   │   └── types.ts     # Shared contracts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Message bubbles, Code blocks
│   │   ├── pages/       # List, Detail
│   │   └── api.ts       # Fetch wrappers
│   └── package.json
└── package.json         # Workspace/runner scripts (npm run view)
```

**Structure Decision**: The project will utilize a simple frontend/backend split nested under a `viewer` or `scripts/viewer` directory in the repository to keep it cleanly separated from the core agent logic while providing the necessary UI capabilities.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
