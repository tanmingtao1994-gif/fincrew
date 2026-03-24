# Technical Research: Eval Results Viewer

## Unknown 1: Technical Stack for Local UI
**Decision**: Use an SPA (React/Next.js/Vite) or a simple script that generates an HTML file. Given the feedback, a heavy backend is not needed. The visualization can be achieved by reading local files directly via a local script or a very lightweight dev server (like Vite) serving a purely client-side app that fetches local JSON.
**Rationale**: The user pointed out this should be like `npm analyze` - a local visualization tool. No complex backend routing is needed since data source is purely static local files in `tests`.
**Alternatives considered**: Express.js backend + React frontend. Rejected based on user feedback to simplify the architecture and treat it as a local CLI/visualization tool rather than a full web service.

## Unknown 2: Parsing and Correlating Multi-source JSON/JSONL Data
**Decision**: A local Node.js script will parse the `tests` directory (`eval_dataset`, `eval_results`, and `llm_invoke_results`) and either inject the joined data directly into a static HTML file, or serve them statically via a minimal local server (e.g., using `vite` or `http-server`) so the frontend SPA can fetch them as static assets.
**Rationale**: Simplifies the architecture. In-memory joins or static JSON generation perfectly suits a local viewer where data size is bounded.

## Unknown 3: Handling Long Outputs and Multi-modal Content
**Decision**: Use distinct React components for different `role` and `content.type`. Implement CSS `max-height` with an `overflow-y: auto` and a "Show More" toggle for `toolResult` or large text blocks.
**Rationale**: Fulfills the requirement to prevent page lag and maintain scrolling experience (SC-005). Componentizing allows clear visual distinction (SC-003).
**Alternatives considered**: Virtualized lists. Might be overkill unless a single conversation has thousands of turns. CSS max-height is simpler and effectively addresses the immediate edge case.

## Unknown 4: UI Framework for Chat Simulation
**Decision**: Use a lightweight UI component library (like Tailwind CSS or an unstyled library with custom CSS) to construct chat bubbles and code blocks. Use `react-markdown` or a similar library to render Markdown/JSON gracefully inside message blocks.
**Rationale**: Chat interfaces require specific styling (left/right alignment, distinct backgrounds). A flexible CSS framework allows replicating typical LLM chat interfaces easily.
**Alternatives considered**: Heavy component libraries like MUI. Might introduce unnecessary bloat for a simple local viewer.
