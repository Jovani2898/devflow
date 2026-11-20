# Data Model: Task Management and Kanban Board

Product meaning stays in [spec.md](./spec.md). Stored JSON is defined in [contracts/persistence.md](./contracts/persistence.md). This file is the logical model implementers test in `src/lib/tasks/domain.ts`.

## Task

One piece of work on the only board.

| Field | Type | Stored | Shown | Rules |
|-------|------|--------|-------|-------|
| `id` | string | yes | no | Required, unique, stable across edit and move. Generated outside the domain. |
| `title` | string | yes | card and dialogs | Trimmed. Length 1–200. Whitespace-only is rejected. |
| `description` | string | yes | edit form | Trimmed. Length 0–5000. Empty is valid. |
| `priority` | `Low` \| `Medium` \| `High` | yes | card and form | Exactly one. Create form starts at Medium. |
| `status` | `To Do` \| `In Progress` \| `Done` | yes | column and form | Exactly one. Create form starts at To Do. |
| `placedAt` | integer | yes | no | Sort key. Larger values appear first. |

Two tasks may share a title. They remain different records because their ids differ. Editing or deleting one does not change the other.

`placedAt` is assigned by the rune module:

- Create: a new value newer than every `placedAt` already issued in the page.
- Move, or an edit that changes `status`: a new newer value, so the task is first in the destination column.
- Edit that keeps `status`: the existing `placedAt`.
- Move or edit that selects the status the task already has: the existing `placedAt`.

Display order in a column is `placedAt` descending. Equal values break ties by `id` ascending. The stored array order is not the display order. Load re-sorts from the fields.

## Status

Canonical order is fixed:

1. To Do
2. In Progress
3. Done

A task may move from any status to any status, including its current one. The current-status case changes no field.

The visible columns are the selected subset of this list, still in this order. An unselected status has no column. Selection is view state, not a field on the task.

## Priority

Stored values are Low, Medium, and High. The filter value All is not stored on a task. All matches every priority. A task filter uses exactly one of All, Low, Medium, or High.

## Board document

The persisted board is a list of tasks plus schema version `1`. It has no project id, account id, filter, or draft. Absence of the storage key means a valid board with zero tasks.

Relationships:

- A board has many tasks.
- A task has one status and one priority.
- There is no second board entity and no user entity.

## View state

View state lives in `board.svelte.ts` and is discarded on refresh.

| State | Initial value | Notes |
|-------|---------------|-------|
| `phase` | `loading` | Becomes `ready` or `load-error` after the browser read |
| `tasks` | `[]` | Replaced by the load result. Updated only after a successful save |
| `selectedStatuses` | To Do, In Progress, Done | Any subset, including none |
| `priorityFilter` | All | Exactly one choice |
| `form` | closed | Create or edit draft, including unsaved text |
| `fieldError` | none | `title-required`, `title-too-long`, or `description-too-long` |
| `saveError` | none | Set when the latest save fails; cleared on the next attempt |
| `deleteTaskId` | none | The task whose confirmation is open |

Default filters are restored when the page initializes and when the last saved task is deleted (ES-004). Other deletes keep the current filters. Clearing filters sets the same defaults.

## Validation

Applied on create and on edit, before any storage write. The same parser accepts stored records on load; a stored record that fails is a corrupt document, not a field error in the form.

| Rule | Result |
|------|--------|
| VR-001 | Trim, then require at least one character. Code `title-required`. |
| VR-002 | Trimmed title longer than 200 is `title-too-long`. 200 is accepted. |
| VR-003 | Empty description is accepted. Trimmed length over 5000 is `description-too-long`. 5000 is accepted. |
| VR-004 | Priority outside the three values is rejected. The form only offers the three values. |
| VR-005 | Status outside the three values is rejected. The form and the move select only offer the three values. |
| VR-006 | Create draft opens as To Do and Medium until the user changes them. |
| VR-007 | Failure leaves the stored task list unchanged and identifies the failed rule. |
| VR-008 | Title equality is not a uniqueness check. |

Messages shown to the user:

| Code | Message |
|------|---------|
| `title-required` | Title is required |
| `title-too-long` | Title is too long |
| `description-too-long` | Description is too long |
| load corrupt or unavailable | Tasks could not be loaded |
| save failed | The task could not be saved |
| missing id on edit or delete | The task is no longer available. |

## Transitions

```text
load missing key        → ready, zero tasks, default filters
load valid document     → ready, those tasks, default filters
load corrupt/unavailable → load-error, previous storage bytes kept

create valid            → append task, save, then show it if its status is selected
create invalid          → no storage write, form remains with the field error
edit valid              → replace that id, save
edit invalid            → stored task unchanged
edit missing id         → no storage write, "no longer available"
cancel create or edit   → discard the draft
move                    → same as an edit that changes only status
delete cancel           → task unchanged
delete confirm          → remove that id, save; if none remain, default filters and ES-001
filter change           → no storage write and no task mutation
refresh                 → new page load, stored tasks kept, draft discarded, default filters
```

A save that throws does not apply the pending task list. The form or move the user just attempted stays available so they can retry.

## Derived view

Given the loaded tasks, the selected statuses, and the priority filter:

- If phase is `load-error`, the view is ES-005.
- If no status is selected, the view is ES-003 and there are no columns.
- Otherwise there is one column per selected status, in canonical order.
- A column lists matching tasks in `placedAt` order. Priority All leaves priority unfiltered. Any other priority keeps only that value.
- A selected column with no matching task is ES-002.
- If there are no saved tasks and at least one status is selected, the board also shows ES-001 and the create action. Selected columns remain visible and empty.

Filter and order functions return new arrays. They do not sort or splice the stored list in place.
