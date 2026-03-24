# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个类似 promptfoo view / webpack-bundle-analyzer 的本地 Web 可视化工具。不再需要厚重的后端服务。整体架构转变为一个本地执行的 Node.js 脚本，该脚本读取 `tests` 目录下的源文件，进行数据组装，然后启动一个轻量级的本地静态服务器（如 Vite）来展示预构建的 React/前端页面，数据可以直接作为静态资源注入或由前端直接请求本地文件。开发代码放置在主项目的 `src/viewer` 或 `scripts` 目录中。

## Technical Context

**Language/Version**: TypeScript / Node.js 18+, React (Frontend)
**Primary Dependencies**: Vite (for local serving/building), Tailwind CSS & react-markdown (UI)
**Storage**: Local JSON/JSONL files (Read-only)
**Testing**: Jest or Vitest
**Target Platform**: Local developer environment (CLI tool -> Browser)
**Project Type**: Local CLI visualization tool + SPA
**Performance Goals**: Startup < 5s, List render < 1s
**Constraints**: Zero database dependencies, must handle large toolResult texts gracefully
**Scale/Scope**: Local scoped, handles hundreds of test cases and corresponding JSONL logs smoothly

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Atomicity**: 数据解析逻辑与 UI 渲染逻辑分离。
- **Interface Contract**: Strict TypeScript interfaces will be defined for `TestCase`, `EvalRun`, and `LLMMessage` shared between data parser and UI.
- **Dependency Inversion**: 脚本层面避免循环依赖。
- **Exception Propagation**: 解析错误在命令行输出友好提示，并在 UI 层面优雅降级。
- **Documented Code**: 核心解析器和 UI 组件将包含 JSDoc。
- **Language Presentation**: UI 和文档使用中文，代码标识符和 API 使用英文。

## Project Structure

### Documentation (this feature)

```text
specs/002-eval-results-viewer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

*(Note: API contracts directory is removed as we are not building a REST API backend anymore)*

### Source Code (repository root)

```text
# Source Code
src/viewer/
├── cli.ts               # CLI entry point (npm run view)
├── parser/              # Data processing and joining logic
│   └── index.ts
└── ui/                  # React SPA (Vite project)
    ├── src/
    │   ├── components/  # Message bubbles, Code blocks
    │   ├── pages/       # List, Detail
    │   └── App.tsx
    ├── index.html
    └── package.json     # Or integrated into root package.json
```

**Structure Decision**: 采用本地脚本加静态 SPA 的模式。视图相关代码统一放在 `src/viewer` 目录下，`cli.ts` 负责读取 `tests` 数据、组装为 JSON 并启动 Vite 服务器预览 `ui/` 目录中的前端应用。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
