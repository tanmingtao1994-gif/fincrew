# Plan: Stock Rich Refactoring & Integration

**Goal**: Fully integrate `src/stock_rich` into the root `ai-financial-assistant` project, flattening the structure and unifying dependencies/configuration.

## Current State vs Target State

| Feature | Current (`src/stock_rich`) | Target (Root) |
| :--- | :--- | :--- |
| **Dependencies** | Separate `package.json` | Merged into root `package.json` |
| **Config** | Separate `tsconfig.json` | Merged into root `tsconfig.json` |
| **Source** | Nested `src/stock_rich/src` | Flattened `src/stock_rich` |
| **Data/Config** | Inside `src/stock_rich` | Moved to root `./data` and `./config` |
| **Execution** | `npm run collect` (inside subdir) | `npm run stock:collect` (from root) |

## Execution Steps

### Phase 1: File Structure Reorganization

1.  **Move Configuration & Data**
    *   Move `src/stock_rich/config/` -> `./config/`
    *   Move `src/stock_rich/data/` -> `./data/`
    *   *Note*: Ensure git tracks these moves correctly.

2.  **Flatten Source Code**
    *   Move contents of `src/stock_rich/src/*` -> `src/stock_rich/`
    *   Remove empty `src/stock_rich/src` directory.

3.  **Cleanup**
    *   Delete `src/stock_rich/package.json`, `pnpm-lock.yaml`, `tsconfig.json`.

### Phase 2: Configuration & Dependencies

1.  **Merge `package.json`**
    *   Add missing dependencies from `stock_rich` to root:
        *   `technicalindicators`
        *   `rettiwt-api`
        *   `youtube-transcript`
        *   `fast-xml-parser`
        *   `inquirer`
    *   Add scripts to root `package.json`:
        *   `"stock:collect": "node --loader ts-node/esm src/stock_rich/index.ts collect"`
        *   `"stock:data": "node --loader ts-node/esm src/stock_rich/index.ts data"`
        *   `"stock:options": "node --loader ts-node/esm src/stock_rich/index.ts options"`
        *   `"stock:news": "node --loader ts-node/esm src/stock_rich/index.ts news"`

2.  **Update `tsconfig.json`**
    *   Ensure `include` covers `src/**/*`.
    *   Enable `resolveJsonModule` (required for importing JSON configs).

### Phase 3: Code Refactoring (Path Fixes)

1.  **Fix Path Logic in `src/stock_rich/utils/cache.ts`**
    *   Remove `import.meta.url` relative path logic.
    *   Use `process.cwd()` to resolve `data/` and `output/` directories.

2.  **Fix Path Logic in Collectors**
    *   Update `src/stock_rich/collectors/{twitter,weibo,youtube}.ts` to read config from `process.cwd() + '/config/kols.json'`.

3.  **Update `src/utils/dailyStorage.ts`**
    *   Update default base dir from `src/stock_rich/data/daily` to `data/daily`.

4.  **Refactor `StockRichAdapter.ts`**
    *   **Crucial Change**: Instead of `spawn('node', ...)`:
    *   Import functions directly from `src/stock_rich/index.ts` (or export specific runner functions).
    *   This allows running in the same process, better error handling, and type safety.

### Phase 4: Verification

1.  Run `npm install` to finalize dependencies.
2.  Run `npm run stock:data -- --symbols AAPL` to verify CLI via scripts.
3.  Run `npm test` to ensure adapters work with the new structure.
