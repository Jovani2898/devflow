# Contract: Board UI

This is the user-facing contract for the home route. Names below are accessible names. Tests use roles and these names rather than CSS classes.

Visual styling uses the Tailwind import already loaded by `src/routes/+layout.svelte`. Status order and copy come from [data-model.md](../data-model.md).

## Page regions

| Region | Requirement |
|--------|-------------|
| Heading | One `h1` named `Board` |
| Loading | Status named `Loading tasks` before the browser read completes. No create action is required on this status. It is removed after load. |
| Filters | Status group and priority group described below |
| Board | Either ES-005, ES-003, or the selected columns. ES-001 sits with the columns when there are no saved tasks. |
| Absent controls | No sign-in, account, role, sharing, project list, board switcher, or rearrange handle |

## Filters

Status is a `group` named `Status` with checkboxes `To Do`, `In Progress`, and `Done`. The user can check any combination. Unchecking a status removes that column. Checking it shows the column again in canonical order.

Priority is a `radiogroup` named `Priority` with radios `All`, `Low`, `Medium`, and `High`. One is selected. `All` is selected on load and after Clear filters.

`Clear filters` is a button. It checks all three statuses and selects `All`. It does not change stored tasks.

Filter controls stay available during ES-001, ES-002, and ES-003. During ES-005 the page shows the load alert and does not present an empty board.

## Columns and cards

Each visible column is a region with a level-2 heading of the status name. Column order follows the selected statuses in To Do, In Progress, Done order.

A card shows the task title and its priority words. It does not show the description or `placedAt`.

| Control | Accessible name | Activation |
|---------|-----------------|------------|
| Edit | `Edit {title}` | Opens the form with that task's fields |
| Status | `Status for {title}` | Select with options To Do, In Progress, Done. The current status is selected. Changing it moves the task. |
| Delete | `Delete {title}` | Opens the delete dialog |

An empty selected column includes the text `No tasks` and keeps its heading (ES-002).

## Form

The create button is named `Create task`. The form is a dialog named `Create task` or `Edit task`, so its Title, Description, Priority, and Status fields stay distinct from the board filters with the same words.

| Field | Control | Opening value |
|-------|---------|---------------|
| Title | textbox labeled `Title` | Empty on create; stored title on edit |
| Description | textbox labeled `Description` | Empty on create; stored description on edit |
| Priority | select labeled `Priority` with Low, Medium, and High | Medium on create; stored priority on edit |
| Status | select labeled `Status` with To Do, In Progress, and Done | To Do on create; stored status on edit |

Buttons: `Save` and `Cancel`. Cancel closes the form and leaves stored tasks unchanged. Save runs validation. On success the form closes and, if that status is selected, the card is visible. On a field error the form stays open and an alert repeats one of: `Title is required`, `Title is too long`, `Description is too long`. On a storage error the form stays open, the typed values remain, and an alert says `The task could not be saved`.

## Delete dialog

Modal dialog. Its name includes the task title. The dialog text includes that same title. Buttons: `Confirm delete` and `Cancel`. Cancel and the platform Escape action close the dialog and leave every task in place. Confirm removes that task only. If it was the last saved task, the board shows `No tasks yet`, all status checkboxes are checked, and priority `All` is selected.

A confirm or save aimed at an id that is already gone shows `The task is no longer available` and does not change the remaining tasks.

## Empty and error copy

| State | Copy | Action |
|-------|------|--------|
| ES-001 | `No tasks yet` | `Create task` |
| ES-002 | `No tasks` inside the column | Column heading remains |
| ES-003 | `No statuses selected` | `Clear filters` |
| ES-005 | `Tasks could not be loaded` | None in this feature |

ES-001 and ES-003 use different text so a test can tell them apart. ES-005 does not use the ES-001 or ES-003 copy.

## Keyboard and pointer

A user can reach every control in the table above with Tab and activate it with Enter or Space, or with the platform select keys for the status and priority controls. The same controls accept clicks and touch. Focus returns to the control that opened a form or dialog when that surface closes. If the card was deleted, focus moves to `Create task`.

## Viewports

At 390×844 the selected columns are in one vertical sequence in status order. At 1280×800 they are in one horizontal sequence in that same order. Both sizes can uncheck a status, see its column disappear, check it, and see it return. No selected column is placed off-screen without a way to scroll to it in that same order.

## Text handling

Title and description are inserted as text. The page does not interpret them as HTML.
