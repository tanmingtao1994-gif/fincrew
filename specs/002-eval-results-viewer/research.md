# Technical Research: Eval Results Viewer

## Unknown 1: Technical Stack for Local HTTP Service & Web UI
**Decision**: Use Express.js (Node.js) for the local HTTP server and React (Next.js or Create React App) or a lightweight bundled static site for the frontend UI. Given the requirement is a simple viewer similar to `promptfoo view`, a Node.js script that serves static files and an API is the most straightforward approach.
**Rationale**: Node.js is excellent for reading local files and serving them quickly. React provides a robust ecosystem for building complex UIs, particularly for rendering distinct visual elements for different message types (text, thinking, toolCall) efficiently.
**Alternatives considered**: Python (FastAPI + Jinja/React), Go. Node.js is selected assuming the primary project context or typical AI toolchain (like promptfoo) leans towards JavaScript/TypeScript.

## Unknown 2: Parsing and Correlating Multi-source JSON/JSONL Data
**Decision**: The backend service will read the `tests` directory on startup or on-demand, parsing `eval_dataset`, `eval_results`, and `llm_invoke_results`. It will join these datasets in-memory based on the common identifier (`test_id`).
**Rationale**: Reading from local file system directly avoids the need for a database. In-memory joins are extremely fast and perfectly suitable for viewing evaluation results locally where data size is bounded.
**Alternatives considered**: Loading data into a local SQLite database on startup. Too heavy for a simple local viewer.

## Unknown 3: Handling Long Outputs and Multi-modal Content
**Decision**: Use distinct React components for different `role` and `content.type`. Implement CSS `max-height` with an `overflow-y: auto` and a "Show More" toggle for `toolResult` or large text blocks.
**Rationale**: Fulfills the requirement to prevent page lag and maintain scrolling experience (SC-005). Componentizing allows clear visual distinction (SC-003).
**Alternatives considered**: Virtualized lists. Might be overkill unless a single conversation has thousands of turns. CSS max-height is simpler and effectively addresses the immediate edge case.

## Unknown 4: UI Framework for Chat Simulation
**Decision**: Use a lightweight UI component library (like Tailwind CSS or an unstyled library with custom CSS) to construct chat bubbles and code blocks. Use `react-markdown` or a similar library to render Markdown/JSON gracefully inside message blocks.
**Rationale**: Chat interfaces require specific styling (left/right alignment, distinct backgrounds). A flexible CSS framework allows replicating typical LLM chat interfaces easily.
**Alternatives considered**: Heavy component libraries like MUI. Might introduce unnecessary bloat for a simple local viewer.
