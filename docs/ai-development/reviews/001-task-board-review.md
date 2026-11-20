# Independent review: task board

Feature `001-task-kanban-board`. Claude Code reviewed the uncommitted implementation read-only, against the approved specification, Constitution v1.0.0, the technical plan, and the UI and persistence contracts. Cursor then fixed the two confirmed defects. This record describes those defects, the fixes, the regression tests, and the limits that remain.

The review did not change files. The fixes did not add dependencies.

## Defect 1: a failed delete hid the save error

Severity: confirmed, and it blocked AC-014 for delete.

`confirmDelete` in `src/lib/tasks/board.svelte.ts` removes the task in memory only after `saveBoard` succeeds. When `setItem` throws, `persist` sets the save error and returns without assigning the new task list, and `deleteTaskId` stays set, so the dialog stays open. That part preserves the task and allows another attempt.

The alert was rendered on the page, outside the dialog. The dialog is opened with `showModal()`, which puts it in the top layer and makes the rest of the page inert. The user could not see or use the message "The task could not be saved".

The fix renders that alert inside `src/lib/tasks/components/DeleteDialog.svelte` while the dialog is open. The page-level alert is hidden for the same interval so the open dialog is the accessible error. Confirm stays available. A later successful confirm removes only that task.

## Defect 2: a failed move left the select on an unsaved status

Severity: suspected in the review, then confirmed before the fix.

Each card uses a native select that is not bound to the saved status. Choosing a new status calls `move`. If storage throws, the task list is not updated, so the status prop stays the same. Setting the `selected` attribute on the old option does not put the live control back after the user has changed it.

A component test reproduced this before the fix. It set the select to "In Progress" while the parent kept the status at "To Do". The assertion expected "To Do" and received "In Progress".

The fix makes `move` return whether the save was stored. `src/lib/tasks/components/TaskCard.svelte` sets the select back to the saved status when that result is not `true`. A stored move is left for the board to render in the destination column.

## Regression tests

| Check | Where |
| --- | --- |
| Failed delete shows the alert in the open dialog, leaves the stored task unchanged, and succeeds on a later confirm | `src/routes/board.e2e.ts` |
| A generic `setItem` exception during a move shows the save alert, keeps the select on the saved status, and leaves storage unchanged | `src/routes/board.e2e.ts` |
| The select returns to the saved status when the move callback does not report success | `src/lib/tasks/components/TaskCard.svelte.spec.ts` |
| The open delete dialog shows "The task could not be saved" | `src/lib/tasks/components/DeleteDialog.svelte.spec.ts` |
| `QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, and code `22` are quota failures; any other thrown `setItem` error is unavailable; the previous stored string stays | `src/lib/tasks/storage.spec.ts` |

The delete end-to-end case uses `QuotaExceededError`. The move case uses a plain `Error`. Both are storage exceptions, and both keep the previous document.

## Accompanying corrections

These were part of the same fix pass and were not separate product defects.

- Save, Cancel, and Confirm delete use the same visible `focus-visible` outline as the other board buttons.
- The data model, UI contract, and task list use the exact missing-task message, including its final period: "The task is no longer available."
- The research note for a failed save no longer adds a period that the product message does not have.

## Limitations

- SC-001, the one-minute create bound, has no timed run. It is not claimed as passed.
- SC-009, the moderated 90 percent first-use study, has not been run. It is not claimed as passed.
- The board is one `localStorage` collection in this browser. There are no accounts, and another browser does not see the tasks.
- A second open view updates only after refresh.
- There is no drag-and-drop, no second board, and no in-app repair for corrupt storage.
- The app is not deployed.
- When a save fails, the closed create form can still contain the same alert in the DOM. A closed `dialog` is not shown. The Playwright accessibility tree counted one alert for the failed delete.
