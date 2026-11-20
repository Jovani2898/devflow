# Implementation Plan: Task Management and Kanban Board

**Branch**: `001-task-kanban-board` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-task-kanban-board/spec.md`

## Summary

Replace the SvelteKit starter page with one Kanban board. A user can create, edit, move, delete, and filter tasks, and the saved tasks remain after a browser refresh. Status filtering is multi-select: a column is visible only when its status is selected.

The implementation keeps the current stack and adds no dependencies. Domain rules are pure TypeScript. A Svelte 5 rune module holds view state and calls a dedicated localStorage module. Components render that state and forward actions. localStorage is read and written only in the browser, after hydration. Load and save failures stay visible and do not pretend the board is empty or that a save succeeded.

## Technical Context

**Language/Version**: TypeScript 6 with `compilerOptions.strict` enabled. Node.js 22.17 or newer. Svelte 5.57 runes are forced for application files in `vite.config.ts`.

**Primary Dependencies**: SvelteKit 3.2, Svelte 5, Vite 8, Tailwind CSS 4 through `@tailwindcss/vite`. No dependency is added for this feature.

**Storage**: One localStorage key, `devflow.board.v1`, in this browser origin. Filters and unsaved form input are not stored. The persistence decision, its reason, and its consequences are recorded in [research.md](./research.md) for Constitution Principle X.

**Testing**: Vitest 4. Domain and storage tests run in the existing Node project (`src/**/*.{test,spec}.ts` excluding `*.svelte.spec.ts`). Component tests run in the existing Chromium browser project (`src/**/*.svelte.spec.ts`) with `vitest-browser-svelte`. Critical flows run in Playwright through the existing `npm run test:e2e` script. Acceptance coverage is mapped below.

**Target Platform**: The existing SvelteKit app rendered by `@sveltejs/adapter-auto`. The board is a responsive browser UI. This plan does not select a deployment host, and the app is not described as deployed.

**Project Type**: Single SvelteKit web application. The board replaces `src/routes/+page.svelte`.

**Performance Goals**: A person can add a task and see it in the selected column in under one minute (SC-001). Creating, editing, moving, deleting, and changing filters stays usable with 100 saved tasks (SC-010). No virtualization and no extra cache.

**Constraints**: Server render must not touch `localStorage` or other browser-only APIs. Business rules stay outside components. Persistence stays outside components. Every new control has an accessible name. Create, edit, move, delete, and filter can be completed from the keyboard. The three selected columns remain reachable at a narrow viewport and a desktop viewport. Task text is rendered as text, never as HTML. No accounts, second board, or live sync between open views.

**Scale/Scope**: One board, one origin, one stored document. Statuses are To Do, In Progress, and Done. Priorities are Low, Medium, and High. The priority filter adds All. This feature replaces the starter home page and leaves analytics, accounts, and extra task fields out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Phase 0

| Principle | Gate | Result |
|-----------|------|--------|
| I. SvelteKit architecture | Board UI is a SvelteKit route and layout, Svelte 5 runes, imports through `#lib`. No second framework or router. | Pass |
| II. Strict TypeScript | `tsconfig.json` stays `strict`. Implementation must pass `npm run check`. | Pass |
| III. Separated responsibilities | Domain module decides rules. Storage module reads and writes. Rune module sequences them. Components render and forward actions. | Pass |
| IV. Accessible, responsive UI | [contracts/board-ui.md](./contracts/board-ui.md) names every control, the keyboard path, and both viewports. | Pass |
| V. Minimal dependencies | No package is added. Drag-and-drop, dialog, and form behavior use the platform. | Pass |
| VI. Measurable acceptance | AC-001 through AC-019 already exist in the approved spec. This plan only maps them to tests. | Pass |
| VII. Tested logic and flows | Every domain rule has a Vitest test. Critical flows have a Playwright test. The map is below. | Pass |
| VIII. SSR, security, privacy | Storage is called only when `browser` is true. No server load function reads tasks. No `{@html}`. No secrets. Task bodies are not logged. | Pass |
| IX. Human review | Implementation stops at a reviewable diff. This command does not merge. | Pass |
| X. Recorded decisions | Persistence, authentication, and deployment are recorded in [research.md](./research.md) before code depends on them. | Pass |

No gate fails. Complexity Tracking is empty.

### After Phase 1

The data model, persistence contract, and UI contract use the same boundaries as the pre-research gate. localStorage remains the only store. Filters stay out of the document. Corrupt and failed saves do not rewrite stored tasks. No new framework, package, route tree, or account model appeared. The gate still passes.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-kanban-board/
├── plan.md              # This file
├── research.md          # Phase 0 decisions and trade-offs
├── data-model.md        # Phase 1 entities, validation, transitions
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── persistence.md   # Stored document and load/save results
│   └── board-ui.md      # Accessible board, form, column, and filter contract
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/lib/tasks/
├── domain.ts                         # Pure rules: validate, create, edit, move, delete, filter, order
├── domain.spec.ts                    # Node Vitest
├── storage.ts                        # localStorage load/save; accepts a Storage port
├── storage.spec.ts                   # Node Vitest with an in-memory Storage
├── board.svelte.ts                   # Runes, drafts, filters, calls domain then storage
└── components/
    ├── TaskBoard.svelte              # Columns, empty states, load error
    ├── TaskBoard.svelte.spec.ts
    ├── FilterBar.svelte              # Status checkboxes, priority radios, clear
    ├── FilterBar.svelte.spec.ts
    ├── TaskForm.svelte               # Create and edit, including description
    ├── TaskForm.svelte.spec.ts
    ├── TaskColumn.svelte
    ├── TaskCard.svelte               # Title, priority, status select, edit, delete
    ├── TaskCard.svelte.spec.ts
    ├── DeleteDialog.svelte
    └── DeleteDialog.svelte.spec.ts

src/routes/
├── +layout.svelte                    # Unchanged shell; still loads layout.css
├── layout.css                        # Existing Tailwind entry
├── +page.svelte                      # Replaces the starter page; wires the board
└── board.e2e.ts                      # Playwright critical flows

src/routes/page.svelte.e2e.ts         # Updated to expect the board heading
```

**Structure Decision**: Use the existing single SvelteKit application. Product modules live under `src/lib/tasks/` and are imported as `#lib/tasks/...js`. The home route is the composition root: it constructs the rune store in the browser and passes data and callbacks into presentational components. `src/lib/vitest-examples/` stays as starter samples and is not the product test home. `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`, and `package.json` stay as they are.

## Architecture

Four layers, in one direction:

1. **Domain** (`domain.ts`) accepts and returns data. It trims and validates, creates and updates task records, moves and deletes by id, chooses visible statuses in To Do → In Progress → Done order, filters tasks, and sorts a column. It does not import Svelte, the DOM, or storage.
2. **Persistence** (`storage.ts`) parses and writes the versioned document in [contracts/persistence.md](./contracts/persistence.md). Callers pass `localStorage` or a test double. A missing key is an empty board. Invalid JSON, an unknown version, or a task that fails the domain parser is a load error. The module does not replace that stored value.
3. **State** (`board.svelte.ts`) owns the loaded tasks, the loading phase, the status selection, the priority filter, the form draft, the save error, and the pending delete id. It calls domain functions to decide the next tasks, then storage to commit them. It assigns rune state only after a successful save. Filter changes do not call storage.
4. **UI** renders the contract in [contracts/board-ui.md](./contracts/board-ui.md). Components receive props and callback props. They do not choose column order or call `localStorage`. The create and edit form calls `validateFields` from the domain so an invalid field shows its message without forwarding the save. The length limits remain in the domain, and the board validates again before it commits.

The page calls `init()` from a client `$effect`. The server render, and the first client paint before that effect, show a loading status named "Loading tasks". That status is not ES-001 and not ES-005. After `init()`, the phase is `ready` or `load-error`.

Movement uses a native select named `Status for {title}` on each card. Choosing another status is the move. A native checkbox group is the multi-select status filter. A native radio group is the single priority filter. Delete uses the platform `<dialog>`. No drag-and-drop library is introduced; pointer users operate the same controls.

Description is shown in the create and edit form. The card shows title and priority only. Activating `Edit {title}` opens that form, which is how a user opens the task (AC-004).

## Test Mapping

Tests follow the existing Vitest split and Playwright `**/*.e2e.ts` match. A rule is covered by the smallest test that fails when that rule is wrong. Browser tests cover what the user can observe.

| Criterion | Node Vitest | Component Vitest | Playwright |
|-----------|-------------|------------------|------------|
| AC-001 Create a valid task | `createTask` stores title, description, priority, status, and id | Saving the form shows the card in the selected column | Create a task and see it in its column |
| AC-002 Reject invalid fields | Missing, whitespace, 200 vs 201 title, 5000 vs 5001 description; stored list unchanged | The form shows the matching message and stays open | Save an empty title and see the required-title message |
| AC-003 Column order | Selected statuses return in canonical order, including a subset | Headings render in that order | All three columns, then In Progress and Done only |
| AC-004 Card and description | Domain keeps description on the record | Card shows title and priority; edit form shows description | Open a task and read the description |
| AC-005 Edit and cancel | `updateTask` changes fields; unknown id fails; duplicate titles stay distinct | Save updates the card; Cancel leaves the card unchanged | Edit a title, save, and confirm after reload |
| AC-006 Move | `moveTask` changes status only and places the task first; same status keeps `placedAt` | Keyboard changes the status select | Keyboard move and a pointer move, including into a hidden column |
| AC-007 Delete confirmation | `deleteTask` removes one id | Dialog shows the title; Cancel keeps the card; Confirm removes it | Confirm, reload, and see the other task remain |
| AC-008 Combined filters | Multi-status plus one priority hides non-matches and does not mutate tasks | Checkboxes and radios drive the visible cards; Clear restores them | Select two statuses and High, then clear |
| AC-009 Column visibility | Unselected status is absent from the visible list | Unchecking a status removes that column | Uncheck To Do and see that column gone |
| AC-010 Refresh | Storage round-trip keeps every field; filters are absent from the document | — | Set filters, reload, see every task, all columns, and priority All |
| AC-011 Unsaved input | — | Cancel and a remount do not add the draft | Type a title, reload, and see no new task |
| AC-012 Empty states | Pure view selector returns ES-001, ES-002, ES-003, and ES-005 | Each state renders its text and action | Empty board, empty column, and no status selected |
| AC-013 Corrupt load | Invalid JSON, bad version, and a bad task return `corrupt` and do not write | Load error is distinct from "No tasks yet" | Seed a corrupt key and see ES-005 |
| AC-014 Save failure | `setItem` throwing leaves the previous document | Form values remain and the save alert appears | Init script makes `setItem` throw; the new task is absent |
| AC-015 Names and keyboard | — | `getByRole` finds every contract name | Keyboard-only create, edit, move, filter, clear, and confirmed delete |
| AC-016 Viewports | — | — | 390×844 and 1280×800: three columns in order, then reveal a hidden column |
| AC-017 One board | — | No project, board switcher, or second board control | The same absence on the loaded page |
| AC-018 One browser collection | One storage key; a second load returns the same tasks | — | Two pages in one browser context; the second sees the task after reload. No sign-in control |
| AC-019 Order | Newer `placedAt` is first; status change updates it; same-status edit does not | Column text order matches that rule | Two tasks, a move, and a same-status edit |

ES-004 is part of the AC-007 and AC-012 browser tests: deleting the last saved task selects all statuses, sets priority to All, and shows ES-001. The domain function that chooses the next filters is unit tested.

SC-009, the moderated first-use study, is not an automated test. SC-010 is a Node test with 100 records and one Playwright seed of 100 tasks that edits, moves, deletes, and filters.

## Trade-offs

The chosen alternatives and the rejected ones are written in [research.md](./research.md). The decisions that shape implementation are:

- **localStorage, not a server or IndexedDB.** It matches one shared board in this browser and needs no new package. It is unavailable during SSR, limited to this origin, and can throw or hold unreadable data.
- **Commit memory only after `setItem` succeeds.** The user keeps the previous board and the typed values when a save fails. The cost is that the screen lags the form until the write succeeds, which is acceptable because the write is synchronous.
- **Do not erase corrupt storage.** The user sees ES-005 instead of a false empty board. The cost is that this feature has no repair action.
- **Native select, checkboxes, radios, and dialog.** They provide accessible names and keyboard use without a dependency. Drag-and-drop is omitted, including as an extra gesture.
- **`placedAt` sort key.** One number covers newest-first, move-to-front, and stable same-status edits. It is not shown in the UI.
- **A loading status before hydration.** It prevents a flash of ES-001. It is an implementation state, not a new product empty state.

## Complexity Tracking

No constitution violations require justification. The feature adds no project, framework, router, or dependency.
