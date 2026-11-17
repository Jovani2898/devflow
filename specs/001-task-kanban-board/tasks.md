# Tasks: Task Management and Kanban Board

**Input**: Design documents from `/specs/001-task-kanban-board/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Required. The specification defines AC-001 through AC-019, Constitution Principle VII requires a Vitest test for business rules and an automated UI test for critical flows, and the planning request asks for unit, component, and end-to-end tests. Write each test task so it fails before its implementation task.

**Organization**: Tasks are grouped by user story so each story can be implemented and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at the repository root, as in `specs/001-task-kanban-board/plan.md`
- Product imports use the `#lib` alias and a `.js` suffix, for example `#lib/tasks/domain.js`
- Node tests match `src/**/*.spec.ts` except `*.svelte.spec.ts`
- Component tests match `src/**/*.svelte.spec.ts`
- Playwright tests match `**/*.e2e.ts`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the module folders from the plan without changing the existing stack

- [ ] T001 Create `src/lib/tasks/` and `src/lib/tasks/components/` from `specs/001-task-kanban-board/plan.md`, leaving `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, and `playwright.config.ts` unchanged

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, validation, storage boundary, and the browser-only load shell that every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Write failing parser and validation tests in `src/lib/tasks/domain.spec.ts` for a trimmed title of length 1–200, rejection of a missing or whitespace-only title, rejection of a trimmed title longer than 200, a trimmed description of length 0–5000, rejection of a trimmed description longer than 5000, priority limited to `Low` \| `Medium` \| `High`, and status limited to `To Do` \| `In Progress` \| `Done`
- [ ] T003 [P] Write failing persistence-contract tests in `src/lib/tasks/storage.spec.ts` for key `devflow.board.v1`: a missing key returns zero tasks, a version `1` document round-trips, and the document contains no filter or draft fields, using an in-memory Storage port from `specs/001-task-kanban-board/contracts/persistence.md`
- [ ] T004 Implement the task type, `parseTask`, and validation in `src/lib/tasks/domain.ts` so T002 passes, with title trimmed to 1–200 characters, description trimmed to 0–5000 characters, priority `Low` \| `Medium` \| `High`, status `To Do` \| `In Progress` \| `Done`, a non-empty unique `id`, and an integer `placedAt`, and with no Svelte or `localStorage` import
- [ ] T005 Implement `loadBoard` and `saveBoard` in `src/lib/tasks/storage.ts` so the T003 cases pass, reusing the domain parser, writing `{ "version": 1, "tasks": [] }` shape, and performing no write on load
- [ ] T006 Implement the rune shell in `src/lib/tasks/board.svelte.ts` with phase `loading`, default selected statuses `To Do`, `In Progress`, and `Done`, priority filter `All`, and `init()` that calls storage only when the SvelteKit `browser` flag is true
- [ ] T007 Render a status named `Loading tasks` from `src/routes/+page.svelte` until `init()` finishes, with no `localStorage` call in the route and no ES-001 or ES-005 copy during loading

**Checkpoint**: A browser load can read and write a valid board document, and the server render does not touch storage

---

## Phase 3: User Story 1 - Add a task and see it on the board (Priority: P1) 🎯 MVP

**Goal**: A user creates a valid task and sees its title and priority in the matching column

**Independent Test**: From a board with no tasks and all statuses selected, save title, description, High, and In Progress, and see that task only in In Progress

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Add failing `createTask` tests in `src/lib/tasks/domain.spec.ts` for AC-001: the stored record keeps the supplied `id`, trimmed title, description, priority, and status, duplicate titles are distinct, and an invalid title leaves the list unchanged
- [ ] T009 [P] [US1] Add failing form tests in `src/lib/tasks/components/TaskForm.svelte.spec.ts` for AC-001 and AC-002: the create dialog is named `Create task`, Title and Description start empty, Priority starts at Medium, Status starts at To Do, and Save shows `Title is required`, `Title is too long`, or `Description is too long` without a success callback
- [ ] T010 [P] [US1] Add failing board tests in `src/lib/tasks/components/TaskBoard.svelte.spec.ts` for AC-003 and AC-012: headings `To Do`, `In Progress`, and `Done` appear in that order, a task card shows its title and priority and not its description, an empty selected column says `No tasks`, and zero saved tasks says `No tasks yet`

### Implementation for User Story 1

- [ ] T011 [US1] Implement `createTask` and all-selected `visibleColumns` in `src/lib/tasks/domain.ts`, preserving title 1–200, description 0–5000, and the status order `To Do`, `In Progress`, `Done`
- [ ] T012 [P] [US1] Add the create action to `src/lib/tasks/board.svelte.ts` so a valid task is committed only after `saveBoard` succeeds and an invalid task sets the field error without writing
- [ ] T013 [P] [US1] Build the create dialog in `src/lib/tasks/components/TaskForm.svelte` with labeled Title, Description, Priority, and Status controls, plus `Save` and `Cancel`, using text bindings rather than HTML
- [ ] T014 [P] [US1] Build `src/lib/tasks/components/TaskColumn.svelte` and `src/lib/tasks/components/TaskCard.svelte` so a column heading is the status name and a card shows title and priority only
- [ ] T015 [US1] Compose empty states and columns in `src/lib/tasks/components/TaskBoard.svelte`, stacking columns vertically and placing them in a row from the `md` breakpoint upward with Tailwind utilities
- [ ] T016 [US1] Wire create, cancel, and the board into `src/routes/+page.svelte` through `#lib/tasks/board.svelte.js` and `#lib/tasks/components/` callbacks, without validating or calling storage in the route
- [ ] T017 [US1] Cover AC-001 and ES-001 in `src/routes/board.e2e.ts`: save `Write spec` with description `First task`, priority High, and status In Progress, and see it only in that column

**Checkpoint**: User Story 1 can be demonstrated on its own by creating a task and finding it in the correct column

---

## Phase 4: User Story 2 - Keep tasks after refresh (Priority: P1)

**Goal**: Saved tasks survive a refresh, unsaved input does not, and bad storage is reported without being erased

**Independent Test**: Save three tasks with different statuses and priorities, refresh, and see the same title, description, priority, and status on each

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] Extend `src/lib/tasks/storage.spec.ts` with failing cases for AC-010, AC-013, and AC-014: corrupt JSON, version other than `1`, an invalid task, `getItem` throwing, and `setItem` throwing quota and non-quota errors, each leaving the previous stored string unchanged
- [ ] T019 [P] [US2] Add failing component tests in `src/lib/tasks/components/TaskBoard.svelte.spec.ts` and `src/lib/tasks/components/TaskForm.svelte.spec.ts` that `Tasks could not be loaded` is distinct from `No tasks yet`, and that `The task could not be saved` leaves the typed title in the form

### Implementation for User Story 2

- [ ] T020 [US2] Complete the failure results in `src/lib/tasks/storage.ts`: invalid content returns `{ ok: false, reason: "corrupt" }`, a throwing `getItem` returns `{ ok: false, reason: "unavailable" }`, and a throwing `setItem` returns `quota` or `unavailable` without a second write
- [ ] T021 [US2] Update `src/lib/tasks/board.svelte.ts` so a failed load sets phase `load-error` without writing, and a failed save keeps the previous task list and the open form values
- [ ] T022 [US2] Show `Tasks could not be loaded` from `src/lib/tasks/components/TaskBoard.svelte` and `The task could not be saved` from `src/lib/tasks/components/TaskForm.svelte`, without using ES-001 or ES-003 copy for the load failure
- [ ] T023 [US2] Extend `src/routes/board.e2e.ts` for AC-010, AC-011, AC-013, and AC-014: reload keeps saved tasks and resets filters to all statuses and priority All, a typed but unsaved title disappears on reload, key `{` shows the load error and stays stored, and a throwing `setItem` blocks the new task

**Checkpoint**: Refresh, corrupt storage, and save failure match the persistence contract

---

## Phase 5: User Story 7 - Use one shared board (Priority: P1)

**Goal**: The home page is one board with no accounts, and this browser sees the same stored tasks

**Independent Test**: Open the board, confirm there is no sign-in or board switcher, save a task, and see it again in this browser

### Tests for User Story 7 ⚠️

- [ ] T024 [P] [US7] Add a failing test in `src/lib/tasks/components/TaskBoard.svelte.spec.ts` for AC-017 that the only heading level 1 available to the page contract is `Board` and that no control is named for sign-in, account, sharing, a project list, or a board switcher
- [ ] T025 [P] [US7] Add a failing second-load test in `src/lib/tasks/storage.spec.ts` for AC-018 that two `loadBoard` calls on the same Storage port return the same tasks

### Implementation for User Story 7

- [ ] T026 [US7] Set the `h1` to `Board` in `src/routes/+page.svelte` and keep account, sharing, project, and board-switcher controls out of `src/lib/tasks/components/TaskBoard.svelte`
- [ ] T027 [US7] Extend `src/routes/board.e2e.ts` with two pages in one browser context for AC-017 and AC-018: the second page shows a task saved by the first only after the second page reloads, and neither page offers sign-in

**Checkpoint**: One shared browser board is visible and account controls are absent

---

## Phase 6: User Story 3 - Edit an existing task (Priority: P2)

**Goal**: A user can change title, description, priority, and status, or leave without saving

**Independent Test**: Change every field and save, then change them again and cancel, and confirm only the saved edit remains

### Tests for User Story 3 ⚠️

- [ ] T028 [P] [US3] Add failing `updateTask` tests in `src/lib/tasks/domain.spec.ts` for AC-005 and AC-019: a known id replaces title, description, priority, and status; an unknown id leaves other tasks unchanged; duplicate titles stay distinct; a same-status edit keeps `placedAt`; a status change accepts a newer `placedAt`
- [ ] T029 [P] [US3] Add failing edit tests in `src/lib/tasks/components/TaskForm.svelte.spec.ts` for AC-004 and AC-005: dialog name `Edit task` shows the stored description, Cancel does not call save, and a cleared title shows `Title is required`

### Implementation for User Story 3

- [ ] T030 [US3] Implement `updateTask` in `src/lib/tasks/domain.ts` with the same trimmed title limit of 1–200 and description limit of 0–5000 as create, returning the no-longer-available result for a missing id
- [ ] T031 [US3] Add edit and cancel actions in `src/lib/tasks/board.svelte.ts` that discard the draft on cancel and commit an edit only after a successful save
- [ ] T032 [P] [US3] Add an `Edit {title}` button to `src/lib/tasks/components/TaskCard.svelte`
- [ ] T033 [P] [US3] Add the edit dialog path to `src/lib/tasks/components/TaskForm.svelte`, including the message `The task is no longer available`
- [ ] T034 [US3] Wire edit open, save, and cancel through `src/routes/+page.svelte` without putting validation in the route
- [ ] T035 [US3] Extend `src/routes/board.e2e.ts` for AC-004 and AC-005: opening a task shows its description, cancel keeps the old title after reload, and save keeps the new title after reload

**Checkpoint**: Edit and cancel are true for a seeded task without using create as the only setup

---

## Phase 7: User Story 4 - Move a task between statuses (Priority: P2)

**Goal**: A keyboard or pointer change of the card status select moves the task and places it first in the destination column

**Independent Test**: With all statuses selected, move a To Do task to In Progress, Done, and back to To Do using only the keyboard, leaving title, description, and priority unchanged

### Tests for User Story 4 ⚠️

- [ ] T036 [P] [US4] Add failing `moveTask` tests in `src/lib/tasks/domain.spec.ts` for AC-006 and AC-019: another status changes only status and `placedAt`, the same status keeps `placedAt`, title, description, and priority stay unchanged, and column sort is `placedAt` descending then `id` ascending
- [ ] T037 [P] [US4] Add a failing test in `src/lib/tasks/components/TaskCard.svelte.spec.ts` for a select named `Status for {title}` whose options are `To Do`, `In Progress`, and `Done`

### Implementation for User Story 4

- [ ] T038 [US4] Implement `moveTask` in `src/lib/tasks/domain.ts` so a same-status choice changes no field and another status updates status only when the caller supplies the new `placedAt`
- [ ] T039 [US4] Add the move action and monotonic `placedAt` helper to `src/lib/tasks/board.svelte.ts`, using a value at least one greater than the previous issued value
- [ ] T040 [US4] Add the status select to `src/lib/tasks/components/TaskCard.svelte` and forward its change without calling storage in the component
- [ ] T041 [US4] Extend `src/routes/board.e2e.ts` for AC-006: keyboard and pointer moves between visible columns, followed by a reload that still shows the destination column

**Checkpoint**: Moving a task changes its column and survives refresh

---

## Phase 8: User Story 5 - Delete a task with confirmation (Priority: P2)

**Goal**: A task is removed only after confirmation that shows its title; cancel leaves it in place

**Independent Test**: Create two tasks, cancel deletion of the first, then confirm it, reload, and see only the second task

### Tests for User Story 5 ⚠️

- [ ] T042 [P] [US5] Add failing tests in `src/lib/tasks/domain.spec.ts` for AC-007 and ES-004: `deleteTask` removes only the given id, a missing id changes nothing, and `filtersAfterDelete` returns all three statuses and priority `All` only when zero tasks remain
- [ ] T043 [P] [US5] Add failing dialog tests in `src/lib/tasks/components/DeleteDialog.svelte.spec.ts` for a dialog that includes the task title and buttons `Confirm delete` and `Cancel`

### Implementation for User Story 5

- [ ] T044 [US5] Implement `deleteTask` and `filtersAfterDelete` in `src/lib/tasks/domain.ts`
- [ ] T045 [US5] Add delete confirmation state to `src/lib/tasks/board.svelte.ts` so Cancel and a missing id leave the committed tasks unchanged, and the last successful delete restores default filters
- [ ] T046 [P] [US5] Implement the modal dialog in `src/lib/tasks/components/DeleteDialog.svelte`, closing on Cancel and Escape without a delete callback
- [ ] T047 [US5] Add `Delete {title}` to `src/lib/tasks/components/TaskCard.svelte` and mount `src/lib/tasks/components/DeleteDialog.svelte` from `src/lib/tasks/components/TaskBoard.svelte`
- [ ] T048 [US5] Extend `src/routes/board.e2e.ts` for AC-007: cancel keeps the task, confirm removes only that task after reload, and deleting the last stored task while another task is in a hidden status is deferred to T056; this task covers the last visible saved task showing `No tasks yet`

**Checkpoint**: Confirmed deletion survives refresh, and cancel does not delete

---

## Phase 9: User Story 6 - Filter tasks by status and priority (Priority: P3)

**Goal**: Any combination of status columns can be shown, one priority can narrow the cards, and clearing filters shows every saved task

**Independent Test**: Select only To Do and Done, set priority High, see In Progress hidden and only matching cards, then clear filters and see every task

### Tests for User Story 6 ⚠️

- [ ] T049 [P] [US6] Add failing filter tests in `src/lib/tasks/domain.spec.ts` for AC-003, AC-008, and AC-009: any status subset including none and all three stays in order `To Do`, `In Progress`, `Done`; priority `All` matches every priority; another priority matches only that value; filtering does not mutate stored tasks
- [ ] T050 [P] [US6] Add failing tests in `src/lib/tasks/components/FilterBar.svelte.spec.ts` for a Status checkbox group named `To Do`, `In Progress`, and `Done`, a Priority radio group `All`, `Low`, `Medium`, and `High`, and a `Clear filters` button

### Implementation for User Story 6

- [ ] T051 [US6] Implement visible-task filtering in `src/lib/tasks/domain.ts` so a card is included only when its status is selected and its priority matches the single priority choice
- [ ] T052 [US6] Keep the active status combination and priority choice in `src/lib/tasks/board.svelte.ts` until the user changes them, clears them, or `init()` runs, and do not write filters to storage
- [ ] T053 [P] [US6] Build `src/lib/tasks/components/FilterBar.svelte` with the checkbox group, radio group, and `Clear filters` button from `specs/001-task-kanban-board/contracts/board-ui.md`
- [ ] T054 [US6] Hide unselected columns in `src/lib/tasks/components/TaskBoard.svelte`, show `No tasks` in a selected column with no matching card, and show `No statuses selected` with no columns when every status is unchecked
- [ ] T055 [US6] Wire `src/lib/tasks/components/FilterBar.svelte` into `src/routes/+page.svelte` so the filters stay available for ES-001, ES-002, and ES-003
- [ ] T056 [US6] Extend `src/routes/board.e2e.ts` for AC-003, AC-006, AC-008, AC-009, and ES-004: To Do plus Done with High hides In Progress, clear restores every task, unchecking every status shows `No statuses selected`, a move into an unselected status stays hidden until that status is checked, and deleting the last saved task checks all statuses and selects All

**Checkpoint**: Multi-select status filtering and the single priority filter match the approved Q3 C decision

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Keyboard, viewport, scale, focus, and the repository checks that apply to the whole board

- [ ] T057 [P] Complete the AC-015 keyboard path in `src/routes/board.e2e.ts`: keyboard-only create, edit, move, status and priority filter changes, clear, and confirmed delete, with every contract name reachable by role
- [ ] T058 Add the AC-016 viewport checks to `src/routes/board.e2e.ts` at 390×844 and 1280×800, reaching `To Do`, `In Progress`, and `Done` in that order and revealing a hidden column from the status filter
- [ ] T059 [P] Add the SC-010 scale test for 100 tasks to `src/lib/tasks/domain.spec.ts`, asserting filter, move, edit, and delete still return the expected records
- [ ] T060 [P] Update `src/routes/page.svelte.e2e.ts` so its heading assertion expects `Board`
- [ ] T061 Return focus from `src/lib/tasks/components/TaskForm.svelte` and `src/lib/tasks/components/DeleteDialog.svelte` to the invoking control, or to `Create task` when that card is gone, as required by `specs/001-task-kanban-board/contracts/board-ui.md`
- [ ] T062 Keep task title and description as text in `src/lib/tasks/components/TaskCard.svelte` and `src/lib/tasks/components/TaskForm.svelte`, and keep `src/lib/tasks/storage.ts` from logging task titles or descriptions
- [ ] T063 Run `npm run check`, `npm run build`, `npm run test:unit -- --run`, and `npm run test:e2e` from `specs/001-task-kanban-board/quickstart.md` and record the command results
- [ ] T064 [P] Confirm `package.json` and `package-lock.json` have no new dependency and that `tsconfig.json` still has `compilerOptions.strict` enabled

---

## Acceptance Coverage

| Criterion | Tasks | Completes in |
|-----------|-------|--------------|
| AC-001 | T008, T009, T011, T012, T017 | US1 |
| AC-002 | T002, T004, T009, T013 | US1 |
| AC-003 | T010, T011, T049, T051, T056 | US6 for the subset; US1 covers all three selected |
| AC-004 | T010, T014, T029, T033, T035 | US3 |
| AC-005 | T028, T029, T030, T031, T035 | US3 |
| AC-006 | T036, T037, T038, T040, T041, T056 | US6 for a hidden destination; US4 covers visible columns |
| AC-007 | T042, T043, T044, T045, T048 | US5 |
| AC-008 | T049, T050, T051, T052, T056 | US6 |
| AC-009 | T049, T054, T056 | US6 |
| AC-010 | T003, T018, T023 | US2 |
| AC-011 | T023, T029, T031 | US2 for refresh; US3 for leaving an edit |
| AC-012 | T010, T015, T019, T022, T054, T056 | US6 |
| AC-013 | T018, T020, T022, T023 | US2 |
| AC-014 | T018, T019, T020, T021, T023 | US2 |
| AC-015 | T057, plus the named controls added in T013, T032, T037, T043, T050 | Polish |
| AC-016 | T015, T058 | Polish |
| AC-017 | T024, T026, T027 | US7 |
| AC-018 | T025, T027 | US7 |
| AC-019 | T028, T036, T038, T039 | US4 |

SC-010 is T059. SC-009, the moderated 90 percent first-use check, has no automated task because the spec keeps it outside Vitest and Playwright.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup and blocks every user story
- **User Stories (Phases 3–9)**: Depend on Foundational
- **Polish (Phase 10)**: Depends on the user stories whose behavior it verifies

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. No other story is required.
- **User Story 2 (P1)**: T018 starts after Foundational. T019 edits the User Story 1 component specs, and T023 needs the create form from User Story 1, so those two follow User Story 1.
- **User Story 7 (P1)**: Starts after Foundational. T025 uses `src/lib/tasks/storage.spec.ts` and can run beside User Story 1. T024 and T026 edit `TaskBoard.svelte.spec.ts`, `TaskBoard.svelte`, and `+page.svelte`, so they follow the User Story 1 tasks that own those files.
- **User Story 3 (P2)**: Starts after Foundational storage load. The edit end-to-end test can seed `localStorage` and does not require the create form.
- **User Story 4 (P2)**: Starts after Foundational. Visible-column moves do not require filters. The hidden-destination case waits for User Story 6.
- **User Story 5 (P2)**: Starts after Foundational. The visible last-task empty state does not require filters. The filter reset observed on screen waits for User Story 6.
- **User Story 6 (P3)**: Starts after Foundational and is the story that finishes multi-select column visibility. Its end-to-end test also closes the hidden-move and last-delete filter assertions.

### Within Each User Story

- Failing tests come before implementation
- Domain changes come before the rune module that calls them
- The rune module and presentational components can proceed on separate files
- The route wiring and Playwright task come after the components they exercise

### Parallel Opportunities

- T002 and T003 can run together
- T008, T009, and T010 can run together
- T012, T013, and T014 can run together after T011
- T018 and T019 can run together
- T024 and T025 can run together
- T028 and T029 can run together
- T032 and T033 can run together after T031
- T036 and T037 can run together
- T042 and T043 can run together
- T046 can run beside T045
- T049 and T050 can run together
- T053 can run beside T052
- T057, T059, T060, and T064 can run together
- After Foundational, T025 can proceed beside User Story 1. User Stories 3, 4, and 5 can proceed beside one another when each person keeps to that story's component file. Shared files such as `domain.ts`, `board.svelte.ts`, `+page.svelte`, and `board.e2e.ts` stay sequential.

---

## Parallel Example: User Story 1

```bash
# Failing tests in separate files:
Task: "T008 createTask tests in src/lib/tasks/domain.spec.ts"
Task: "T009 form tests in src/lib/tasks/components/TaskForm.svelte.spec.ts"
Task: "T010 board tests in src/lib/tasks/components/TaskBoard.svelte.spec.ts"

# Implementation on separate files after T011:
Task: "T012 create action in src/lib/tasks/board.svelte.ts"
Task: "T013 create dialog in src/lib/tasks/components/TaskForm.svelte"
Task: "T014 column and card in src/lib/tasks/components/TaskColumn.svelte and TaskCard.svelte"
```

## Parallel Example: User Story 2

```bash
Task: "T018 storage failure tests in src/lib/tasks/storage.spec.ts"
Task: "T019 load and save alert tests in TaskBoard.svelte.spec.ts and TaskForm.svelte.spec.ts"
```

## Parallel Example: User Story 7

```bash
Task: "T024 absence assertions in src/lib/tasks/components/TaskBoard.svelte.spec.ts"
Task: "T025 second-load test in src/lib/tasks/storage.spec.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T028 updateTask tests in src/lib/tasks/domain.spec.ts"
Task: "T029 edit form tests in src/lib/tasks/components/TaskForm.svelte.spec.ts"

Task: "T032 Edit button in src/lib/tasks/components/TaskCard.svelte"
Task: "T033 edit dialog in src/lib/tasks/components/TaskForm.svelte"
```

## Parallel Example: User Story 4

```bash
Task: "T036 moveTask tests in src/lib/tasks/domain.spec.ts"
Task: "T037 status select test in src/lib/tasks/components/TaskCard.svelte.spec.ts"
```

## Parallel Example: User Story 5

```bash
Task: "T042 delete tests in src/lib/tasks/domain.spec.ts"
Task: "T043 dialog tests in src/lib/tasks/components/DeleteDialog.svelte.spec.ts"

Task: "T045 delete state in src/lib/tasks/board.svelte.ts"
Task: "T046 dialog component in src/lib/tasks/components/DeleteDialog.svelte"
```

## Parallel Example: User Story 6

```bash
Task: "T049 filter tests in src/lib/tasks/domain.spec.ts"
Task: "T050 FilterBar tests in src/lib/tasks/components/FilterBar.svelte.spec.ts"

Task: "T052 filter state in src/lib/tasks/board.svelte.ts"
Task: "T053 FilterBar.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run the User Story 1 Vitest tests and the create scenario in `src/routes/board.e2e.ts`
5. Demo locally. Do not describe the app as deployed

### Incremental Delivery

1. Setup and Foundational are the base
2. User Story 1 delivers create and view
3. User Stories 2 and 7 complete the approved P1 behavior: refresh and one shared board
4. User Stories 3, 4, and 5 add edit, move, and delete
5. User Story 6 adds multi-select status filtering and the priority filter
6. Polish runs the keyboard, viewport, 100-task, typecheck, build, and test checks

### Parallel Team Strategy

1. Complete Setup and Foundational together
2. After that, one person can take User Story 1 while another writes the T025 storage test for User Story 7
3. User Stories 3, 4, and 5 can be split across people when each person owns the component file for that story and they sequence edits to `src/lib/tasks/domain.ts` and `src/lib/tasks/board.svelte.ts`
4. User Story 6 follows the column, card, and page files it changes

---

## Notes

- [P] tasks use different files and do not depend on an unfinished task
- [US1] through [US7] map to the seven stories in `specs/001-task-kanban-board/spec.md`
- User Story 7 is Phase 5 because it is P1; the phase number is priority order, not the story number
- Do not add a dependency, a drag-and-drop gesture, an account, a second board, or an in-app repair action for corrupt storage
- Do not commit unless a person explicitly asks
- Verification evidence comes from the commands in T063
