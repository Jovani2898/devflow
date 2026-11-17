# Quickstart: Task Management and Kanban Board

Validation guide for the implemented feature. Behavior is defined in [spec.md](./spec.md), stored data in [contracts/persistence.md](./contracts/persistence.md), and the screen in [contracts/board-ui.md](./contracts/board-ui.md).

This guide does not add packages and does not include implementation code.

## Prerequisites

- Node.js 22.17 or newer
- Dependencies already installed from `package-lock.json`
- Repository scripts in `package.json`: `check`, `test:unit`, `test:e2e`, `dev`

No new package is required. `npm run test:e2e` is the existing script and installs Playwright browsers before it runs.

## Automated checks

Run from the repository root after implementation:

```sh
npm run check
npm run test:unit -- --run
npm run test:e2e
```

`npm run check` must pass with `compilerOptions.strict` still enabled.

`npm run test:unit -- --run` runs Node tests for `src/lib/tasks/domain.spec.ts` and `src/lib/tasks/storage.spec.ts`, and Chromium component tests for the Svelte specs under `src/lib/tasks/components/`.

`npm run test:e2e` builds the app, previews it on port 4173, and runs `src/routes/board.e2e.ts` plus the updated home-page smoke test.

Expected coverage is the AC-001 through AC-019 map in [plan.md](./plan.md). A failing domain rule fails the Node test. A broken create, refresh, move, delete, or filter path fails Playwright.

## Manual pass

Start the app with `npm run dev` and open the home page.

1. **Empty board (AC-012, ES-001).** With site data cleared, the page settles on `No tasks yet` and `Create task`. The loading status is gone. Three columns are present and each says `No tasks`.
2. **Create (AC-001).** Save title `Write spec`, description `First task`, priority High, status In Progress. The card appears only in In Progress and shows the title and High. Edit shows the description.
3. **Validation (AC-002).** Save a blank title and see `Title is required`. Repeat with a title of spaces, a 201-character title (`Title is too long`), and a 5001-character description (`Description is too long`). The board's saved cards stay unchanged.
4. **Refresh (AC-010, AC-011).** Change the filters, type a new title without saving, and reload. The unsaved title is gone. Saved tasks remain, all three status boxes are checked, and priority All is selected.
5. **Edit and cancel (AC-005).** Change a title and cancel. Reload and confirm the old title. Change it again, save, and reload to confirm the new title.
6. **Move (AC-006, AC-019).** Using only the keyboard, set `Status for Write spec` to Done. The card is first in Done. With a pointer, move it back. Title, description, and priority stay the same.
7. **Filters (AC-008, AC-009).** Uncheck In Progress and Done, set priority to High, and confirm only matching To Do cards remain and the other columns are gone. Clear filters and see every saved task. Uncheck every status and see `No statuses selected`, with no columns.
8. **Delete (AC-007).** Start delete, confirm the dialog names the task, and cancel. The card remains. Confirm a delete and reload. That card is gone and the others remain. Deleting the final card shows `No tasks yet`.
9. **One board (AC-017, AC-018).** The page has no sign-in and no board or project switcher. A second tab in the same browser shows a newly saved task after that tab is reloaded.
10. **Viewports (AC-016).** At a narrow window and a desktop window, reach To Do, In Progress, and Done in that order, create or move a task, and toggle a status filter.

## Failure setup

Use the browser developer tools on the preview or dev origin. The storage key is `devflow.board.v1`.

- **Corrupt load (AC-013).** Set the key to `{` and reload. The page says `Tasks could not be loaded` and does not say `No tasks yet`. The bad value is still present in localStorage.
- **Save failure (AC-014).** Restore a valid board, make `localStorage.setItem` throw, and save a new task. The alert says `The task could not be saved`, the typed title is still in the form, and a reload does not show that new task.

## Out of the automated suite

SC-009, the moderated check that 90 percent of first-time users can add a task and find it, is not run by Vitest or Playwright. The commands above do not deploy the app.
