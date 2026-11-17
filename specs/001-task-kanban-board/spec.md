# Feature Specification: Task Management and Kanban Board

**Feature Branch**: `001-task-kanban-board`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Create the first DevFlow feature: Task Management and Kanban Board. The MVP must allow users to create a task with a required title and an optional description; choose Low, Medium, or High priority; set status to To Do, In Progress, or Done; edit existing tasks; delete tasks with confirmation; view tasks in three Kanban columns; move tasks between statuses; filter tasks by status and priority; and keep tasks after a browser refresh."

## Approved Decisions

These MVP decisions were approved on 2026-11-15:

- **Q1 A**: Anyone using this browser sees the same tasks. This feature has no accounts.
- **Q2 A**: This feature has one board, and every task belongs to it.
- **Q3 C**: The status filter can select any combination of statuses. A column is visible only when its status is selected. Unselected columns are hidden. Column visibility is controlled by that filter.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a task and see it on the board (Priority: P1)

A user creates a task and sees it at once in the column that matches its status, when that column is selected. The board shows the task title and priority. When the user opens the task, its description is available, including when the description was left empty.

**Why this priority**: Creating a task and finding it in the correct column is the first useful outcome of the board. Later stories need at least one saved task.

**Independent Test**: From a board with no tasks and all statuses selected, create one task with a title, a description, High priority, and In Progress. Confirm that it appears only in In Progress and that the title, priority, and description match what was entered.

**Acceptance Scenarios**:

1. **Given** the board has no saved tasks and all statuses are selected, **When** the user opens the board, **Then** the user sees the empty board state (ES-001), including a way to create the first task and empty columns for To Do, In Progress, and Done.
2. **Given** the user is creating a task and all statuses are selected, **When** they enter a title, leave the description empty, leave the initial priority and status unchanged, and save, **Then** the task is saved and appears first in the To Do column with Medium priority and the entered title.
3. **Given** the user is creating a task and all statuses are selected, **When** they enter a title and a description, choose High priority and In Progress, and save, **Then** the task appears only in the In Progress column, the board shows its title and High priority, and opening the task shows the description.
4. **Given** the user is creating a task, **When** they try to save without a title, **Then** no task is added and the user is told that a title is required.
5. **Given** the user enters a title of only spaces, **When** they try to save, **Then** no task is added and the user is told that a title is required.
6. **Given** the user enters a title longer than 200 characters after trimming, **When** they try to save, **Then** no task is added and the user is told that the title is too long.
7. **Given** the user enters a description longer than 5,000 characters after trimming, **When** they try to save, **Then** no task is added and the user is told that the description is too long.
8. **Given** the user enters a title with spaces before or after the words, **When** they save, **Then** the saved title omits those leading and trailing spaces.
9. **Given** all statuses are selected and at least one selected column contains a task while another selected column does not, **When** the user views the board, **Then** the empty selected column remains named and shows the empty-column state (ES-002).
10. **Given** To Do is not selected, **When** the user saves a new To Do task, **Then** the task is saved, the To Do column stays hidden, and selecting To Do shows that task in the To Do column.

---

### User Story 2 - Keep tasks after refresh (Priority: P1)

Saved tasks are still on the board after the user refreshes the browser. Each saved task keeps its title, description, priority, and status. This browser has one shared collection of tasks.

**Why this priority**: The feature requires work to remain after a refresh. A board that starts empty on every visit does not meet that request.

**Independent Test**: Save three tasks with different statuses and priorities, refresh the browser, and confirm that all three are present with the same title, description, priority, and status.

**Acceptance Scenarios**:

1. **Given** one or more tasks have been saved, **When** the user refreshes the browser, **Then** every saved task appears in its status column with the same title, description, priority, and status, all three columns are visible, and priority is All.
2. **Given** the user has entered task information and has not saved it, **When** the user refreshes the browser, **Then** that entry is absent from the board and every previously saved task is unchanged.
3. **Given** saved tasks cannot be loaded, **When** the user opens the board, **Then** the user is told that the tasks could not be loaded, and the board shows the load error (ES-005) rather than the empty-board state (ES-001).
4. **Given** the board is open in two views in this browser, **When** the user saves a task in one view and refreshes the other view, **Then** the refreshed view shows that saved task with the same title, description, priority, and status.

---

### User Story 3 - Edit an existing task (Priority: P2)

A user can change a saved task's title, description, priority, and status. Saving shows the updated task when its status column is selected. Leaving the edit without saving leaves the saved task unchanged.

**Why this priority**: Tasks change after they are created. Editing is separately testable once a task exists, and the requested feature includes it.

**Independent Test**: Create a task, change its title, description, priority, and status, save, and confirm the board shows the new values. Edit it again, leave without saving, and confirm the saved task is unchanged.

**Acceptance Scenarios**:

1. **Given** a saved task whose status column is selected, **When** the user changes its title, description, and priority and saves, **Then** the board shows the new title and priority in the same column, and opening the task shows the new description.
2. **Given** a saved task in To Do and Done is selected, **When** the user changes its status to Done and saves, **Then** the task appears in the Done column and is absent from To Do.
3. **Given** the user has changed one or more fields and has not saved, **When** the user leaves the edit, **Then** the task keeps the title, description, priority, and status it had when the edit started.
4. **Given** the user is editing a task, **When** they clear the title and try to save, **Then** the saved task is unchanged and the user is told that a title is required.
5. **Given** the user clears a task's description and saves, **When** they open the task, **Then** the description is empty and the title, priority, and status are otherwise unchanged.
6. **Given** the task is no longer available, **When** the user tries to save an edit, **Then** no remaining task is changed and the user is told that the task is no longer available.
7. **Given** Done is not selected, **When** the user edits a visible task to Done and saves, **Then** the task is saved with status Done, the Done column stays hidden, and selecting Done shows the updated task.

---

### User Story 4 - Move a task between statuses (Priority: P2)

A user moves a task from one status to another from the board. The task then appears in the destination column when that status is selected. Title, description, and priority stay the same. The user can complete the move with a keyboard and with a mouse or touch.

**Why this priority**: Moving work between columns is the main board action. It is independently testable once a task exists, including when the user does not edit any other field.

**Independent Test**: With all statuses selected, create a To Do task and move it to In Progress, then to Done, then back to To Do, using only the keyboard. Confirm the column changes each time and the title, description, and priority stay the same.

**Acceptance Scenarios**:

1. **Given** all statuses are selected and a task is in To Do, **When** the user moves it to In Progress, **Then** it appears first in In Progress, it is absent from To Do, and its title, description, and priority are unchanged.
2. **Given** all statuses are selected and a task is in In Progress, **When** the user moves it to Done, **Then** it appears only in Done.
3. **Given** all statuses are selected and a task is in Done, **When** the user moves it to To Do, **Then** it appears only in To Do.
4. **Given** a task is already in a selected column, **When** the user chooses that same status, **Then** the task stays in that column and its title, description, and priority are unchanged.
5. **Given** the user is using only a keyboard and the destination status is selected, **When** they move a task to that status, **Then** the task appears in the destination column.
6. **Given** a task was moved and its destination status is selected, **When** the user refreshes the browser, **Then** the task is still in the destination column.
7. **Given** In Progress is not selected and a task is visible in To Do, **When** the user moves it to In Progress, **Then** the saved status is In Progress, the In Progress column stays hidden, and selecting In Progress shows the task in that column.

---

### User Story 5 - Delete a task with confirmation (Priority: P2)

A user can remove a task only after confirming the removal. The confirmation names the task by its title. Cancelling leaves the task on the board.

**Why this priority**: Deletion is permanent in this feature. The requested confirmation is a separate, testable flow from editing and moving.

**Independent Test**: Create two tasks. Start deleting the first, cancel, and confirm both remain. Start deleting the first again, confirm, refresh, and confirm that only the second task remains.

**Acceptance Scenarios**:

1. **Given** a saved task, **When** the user asks to delete it, **Then** the user is asked to confirm, the confirmation shows that task's title, and the task remains on the board until the user confirms.
2. **Given** a delete confirmation is open, **When** the user cancels, **Then** the confirmation closes and the task remains in its column with its title, description, priority, and status unchanged.
3. **Given** a delete confirmation is open, **When** the user confirms, **Then** that task is removed, every other task remains, and the removed task is still absent after a refresh.
4. **Given** the confirmed deletion removes the last saved task, **When** the board updates, **Then** the user sees the empty board state (ES-001), with all three statuses selected and priority set to All.
5. **Given** the user is using only a keyboard, **When** they open a delete confirmation, cancel, open it again, and confirm, **Then** the cancellation leaves the task in place and the later confirmation removes it.
6. **Given** the task is no longer available, **When** the user confirms deletion, **Then** no remaining task is removed and the user is told that the task is no longer available.
7. **Given** a selected column has one visible task and a hidden column has another saved task, **When** the user confirms deletion of the visible task, **Then** the hidden task remains saved, and the selected column shows the empty-column state (ES-002).

---

### User Story 6 - Filter tasks by status and priority (Priority: P3)

A user chooses which status columns are visible and which priority is visible. The user can select any combination of To Do, In Progress, and Done. A task is visible only when its status is selected and its priority matches the priority filter. Clearing the filters shows every saved task again. Filtering does not change saved tasks.

**Why this priority**: Filters help the user focus. Creating, keeping, editing, moving, and deleting tasks already provide a usable board. Priority ranks delivery order inside this feature. Filtering remains part of this feature.

**Independent Test**: Create tasks that differ in status and priority. Select only To Do and Done, set priority to High, then clear both filters. Confirm that In Progress is hidden, that only matching High tasks appear in the visible columns, and that clearing the filters shows every task in all three columns.

**Acceptance Scenarios**:

1. **Given** saved tasks exist in more than one status and priority, **When** the user opens the board for the first time in this visit, **Then** all three statuses are selected, priority is All, and every saved task is visible in its status column.
2. **Given** tasks have different priorities and all statuses are selected, **When** the user sets the priority filter to High, **Then** only High priority tasks are visible, all three columns stay visible, and a column with no High task shows the empty-column state (ES-002).
3. **Given** tasks exist in all three statuses, **When** the user selects only To Do, **Then** the To Do column is visible, the In Progress and Done columns are hidden, and only To Do tasks that match the priority filter are visible.
4. **Given** tasks exist in all three statuses, **When** the user selects To Do and Done and leaves In Progress unselected, **Then** the visible columns are To Do and Done, in that order, and the In Progress column is hidden.
5. **Given** To Do and Done are selected and the priority filter is High, **When** the user views the board, **Then** a task is visible only when its status is To Do or Done and its priority is High.
6. **Given** one or more columns are hidden or the priority filter is narrowing the tasks, **When** the user clears the filters, **Then** all three statuses are selected, priority is All, and every saved task is visible in its status column.
7. **Given** saved tasks exist, **When** the user unselects every status, **Then** no columns are shown, the saved tasks are unchanged, and the user sees the no-status state (ES-003), including a way to clear the filters.
8. **Given** a status filter, a priority filter, or both are active, **When** the user refreshes the browser, **Then** the saved tasks are unchanged, all three statuses are selected, and priority is All.
9. **Given** the user is using only a keyboard, **When** they select two statuses, set a priority, and then clear the filters, **Then** the visible columns and tasks follow scenarios 4, 5, and 6.

---

### User Story 7 - Use one shared board (Priority: P1)

The user works on a single board. Opening the board shows that board's tasks, and the feature offers no second board, project list, sign-in, or account switcher.

**Why this priority**: The approved MVP decisions define the product boundary. The board is usable only when the user can tell there is one shared collection of tasks.

**Independent Test**: Open the board, confirm there is no sign-in and no way to switch boards or projects, create a task, refresh, and confirm the same task is shown.

**Acceptance Scenarios**:

1. **Given** the user opens the board, **When** the board is shown, **Then** the user sees one board and sees no project list, board switcher, sign-in, account menu, or sharing control.
2. **Given** a task has been saved in this browser, **When** the user opens the board again in this browser, **Then** that task is present on the same board.
3. **Given** the user looks for a way to add a second board or a project, **When** they inspect the available actions, **Then** no such action is available.

---

### Edge Cases

- A title of the maximum length, 200 characters after trimming, is saved. A title of 201 characters after trimming is rejected, and the stored tasks stay unchanged.
- A description of 5,000 characters after trimming is saved. A description of 5,001 characters after trimming is rejected, and the stored tasks stay unchanged.
- An empty description is valid on create and on edit.
- Two tasks may use the same title. Editing, moving, or deleting one of them leaves the other task unchanged.
- The user cannot save a priority other than Low, Medium, or High, and cannot save a status other than To Do, In Progress, or Done.
- Leaving task creation without saving adds no task.
- A failed save adds or changes no task. The user is told that the save failed, and the values they entered remain available so they can retry.
- Saved tasks that cannot be loaded produce the load error (ES-005). That error is distinct from the empty board state (ES-001) and from the no-status state (ES-003).
- This browser has one task collection. A second open view shows a newly saved task after that view is refreshed. The feature does not update the second view before that refresh.
- The board still supports create, edit, move, delete, and filter when 100 tasks are saved.
- With all statuses selected, a narrow viewport and a desktop viewport both present To Do, In Progress, and Done in that order. With a subset selected, both viewports show only the selected columns, still in that relative order.
- A refresh selects all three statuses and sets priority to All. Saved tasks keep the status and priority they had before the refresh.
- Unselecting every status hides every column and shows ES-003. Clearing filters from that state shows all three columns again.
- A selected column with no visible task shows ES-002. A priority filter does not hide a selected column.
- Moving, creating, or editing a task into an unselected status saves that status and leaves the destination column hidden until the user selects it.
- Deleting the last visible task while tasks remain in a hidden column leaves those hidden tasks saved and shows ES-002 in the empty selected column.
- Deleting the last saved task shows ES-001, with all three statuses selected and priority set to All.
- Inside a column, the most recently created task appears first. A task moved into a column, or saved with a new status, appears first in the destination column. An edit that keeps the same status leaves the task's position unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The user can create a task with a title, a description, a priority, and a status. Acceptance: AC-001.
- **FR-002**: A task is created or updated only when it satisfies the validation rules. Acceptance: AC-002.
- **FR-003**: The board's column order is To Do, then In Progress, then Done. The board shows one column for each selected status and keeps that order among the visible columns. Acceptance: AC-003.
- **FR-004**: A saved task appears in the column for its status when that status is selected. The column shows the task's title and priority. Opening the task shows its description, which may be empty. Acceptance: AC-004.
- **FR-005**: The user can edit the title, description, priority, and status of a saved task. The user can leave an edit without saving, and the saved task then stays as it was. Acceptance: AC-005.
- **FR-006**: The user can move a task to any of the three statuses from the board. The move can be completed with a keyboard and with a mouse or touch. A move changes the status and keeps the title, description, and priority. Acceptance: AC-006.
- **FR-007**: The user can delete a task only after an explicit confirmation that shows that task's title. Cancel leaves the task unchanged. Confirm removes that task and leaves every other task unchanged. The removal is still in effect after a refresh. Acceptance: AC-007.
- **FR-008**: The status filter lets the user select any combination of To Do, In Progress, and Done, including none and all three. The priority filter lets the user select All, Low, Medium, or High, and exactly one of those choices is active. A task is shown only when its status is selected and its priority matches the priority filter. All matches every priority. The active status combination and priority choice stay as the user set them until the user changes them, clears them, or refreshes the browser. Clearing filters selects all three statuses and All priorities, and shows every saved task. Filtering does not change a task's title, description, priority, or status. Acceptance: AC-008.
- **FR-009**: Column visibility follows the status filter. A selected status has a visible column. An unselected status has no column. The board opens with all three statuses selected. Clearing filters makes all three columns visible again. Changing the status filter does not change a saved task. Acceptance: AC-009.
- **FR-010**: After the browser is refreshed, every saved task is available with the same title, description, priority, and status. The refresh also selects all three statuses and sets the priority filter to All. Acceptance: AC-010.
- **FR-011**: Information entered during create or edit and not saved is absent from the board after a refresh or after the user leaves that entry. Acceptance: AC-011.
- **FR-012**: The board uses the empty states in this specification: ES-001 when no tasks are saved and at least one status is selected, ES-002 when a selected column has no visible task, ES-003 when no status is selected, and ES-005 when saved tasks cannot be loaded. Acceptance: AC-012.
- **FR-013**: When saved tasks cannot be loaded, the user is told that the tasks could not be loaded. That condition uses ES-005. Acceptance: AC-013.
- **FR-014**: When a task cannot be saved, the user is told that the save failed, the entered values remain available for another attempt, and the stored tasks stay unchanged. Acceptance: AC-014.
- **FR-015**: Create, edit, save, cancel, move, delete, confirm delete, clear filters, each status choice, and the priority choice each have an accessible name. A user can complete each of those actions with a keyboard alone. Acceptance: AC-015.
- **FR-016**: The board remains usable at a narrow viewport and at a desktop viewport. With all statuses selected, the user can reach To Do, In Progress, and Done at both sizes. At both sizes, the user can change the status filter to show a column that is hidden. Acceptance: AC-016.
- **FR-017**: This feature has exactly one board. Every task belongs to that board. The feature has no project list, no second board, and no board switcher. Acceptance: AC-017.
- **FR-018**: Anyone who opens the board in this browser sees the same tasks. The feature has no sign-in, accounts, roles, or sharing controls. Another browser or device is outside this feature and is not required to show these tasks. Acceptance: AC-018.
- **FR-019**: Inside a column, tasks appear with the most recently created task first. Moving a task into a column, or saving an edit that changes its status, places it first in the destination column. An edit that keeps the same status leaves the task's position unchanged. This feature has no action for rearranging tasks inside a column. Acceptance: AC-019.

### Requirement Acceptance

- **AC-001**: **Given** a title, an optional description, a priority, and a status that satisfy the validation rules, **When** the user saves a new task, **Then** the task is stored and appears in its status column once that status is selected. Covers FR-001.
- **AC-002**: **Given** a missing title, a whitespace-only title, a title longer than 200 characters, or a description longer than 5,000 characters, **When** the user attempts to create or update a task, **Then** the stored tasks are unchanged and the message identifies the failed rule. Covers FR-002 and VR-001 through VR-007.
- **AC-003**: **Given** all three statuses are selected, **When** the user views the board, **Then** the columns are To Do, In Progress, and Done in that order. **Given** only In Progress and Done are selected, **When** the user views the board, **Then** those two columns appear in that order and To Do is absent. Covers FR-003.
- **AC-004**: **Given** a saved task whose status is selected, **When** the user views its column and opens the task, **Then** the column shows its title and priority and the opened task shows its description. Covers FR-004.
- **AC-005**: **Given** a saved task, **When** the user changes any of its title, description, priority, and status and saves, **Then** the stored task has the new values. **When** the user changes those fields and leaves without saving, **Then** the stored task keeps the previous values. Covers FR-005.
- **AC-006**: **Given** a saved task, **When** the user moves it to another status with a keyboard and, in a separate attempt, with a mouse or touch, **Then** each attempt stores the new status, keeps the title, description, and priority, and shows the task in the destination column when that status is selected. Covers FR-006.
- **AC-007**: **Given** a saved task, **When** the user cancels deletion, **Then** that task remains. **When** the user confirms deletion, **Then** that task is absent after refresh and every other task remains. The confirmation shows the task title before removal. Covers FR-007.
- **AC-008**: **Given** tasks of every status and priority, **When** the user selects a combination of statuses and one priority choice, **Then** every visible task has a selected status and a matching priority, and every non-matching task is hidden. The same selection remains while the user creates, edits, moves, or deletes until they change it, clear it, or refresh. **When** the user clears the filters, **Then** all three columns and every saved task are visible. The stored title, description, priority, and status stay unchanged throughout. Covers FR-008.
- **AC-009**: **Given** the board has just opened or the filters have just been cleared, **When** the user views it, **Then** all three columns are visible. **Given** the user unselects a status, **When** the board updates, **Then** that column is hidden and the tasks in the remaining columns keep their stored fields. Covers FR-009.
- **AC-010**: **Given** tasks have been saved and any filter selection is active, **When** the user refreshes the browser, **Then** every saved task is present with its previous title, description, priority, and status, all three columns are visible, and the priority filter is All. Covers FR-010.
- **AC-011**: **Given** the user has typed or selected values in create or edit and has not saved, **When** the user refreshes or leaves that entry, **Then** those unsaved values are absent from the stored tasks. Covers FR-011.
- **AC-012**: **Given** no saved tasks and at least one selected status, **When** the user views the board, **Then** ES-001 is shown. **Given** a selected column has no visible task, **When** the user views that column, **Then** ES-002 is shown. **Given** no status is selected, **When** the user views the board, **Then** ES-003 is shown. **Given** saved tasks cannot be loaded, **When** the user opens the board, **Then** ES-005 is shown. Covers FR-012.
- **AC-013**: **Given** saved tasks cannot be loaded, **When** the user opens the board, **Then** the user is told that the tasks could not be loaded and the board shows ES-005. Covers FR-013.
- **AC-014**: **Given** a save cannot be completed, **When** the save fails, **Then** the user is told that the save failed, the entered values remain available, and the previously stored tasks are unchanged. Covers FR-014.
- **AC-015**: **Given** the user can reach create, edit, save, cancel, move, delete, confirm delete, clear filters, each status choice, and the priority choice, **When** each control is examined and activated with only a keyboard, **Then** each control has an accessible name and each action completes. Covers FR-015.
- **AC-016**: **Given** all statuses are selected, **When** the user views a narrow viewport and a desktop viewport, **Then** To Do, In Progress, and Done are reachable in that order at both sizes. **Given** one status is unselected, **When** the user uses the status filter at either size, **Then** the user can select it and its column appears. Covers FR-016.
- **AC-017**: **Given** the user opens the board and inspects its actions, **When** the board is shown, **Then** there is one board, every visible task belongs to it, and there is no project list, second board, or board switcher. Covers FR-017.
- **AC-018**: **Given** a task was saved in this browser, **When** the user opens the board in this browser without signing in, **Then** the same task is visible and the board has no sign-in, account, role, or sharing control. Covers FR-018.
- **AC-019**: **Given** two tasks in the same column, **When** the user views that column, **Then** the newer task appears above the older task. **Given** a task is moved into a column that already has a task, or an edit saves that task with a new status, **When** the change completes and the destination status is selected, **Then** the task appears first in the destination column. **Given** a task is edited without a status change, **When** the user saves, **Then** its position in the column is unchanged. The board offers no rearrange action inside a column. Covers FR-019.

### Validation Rules

- **VR-001**: Title is required. After leading and trailing whitespace is removed, the title contains at least one character. A missing or whitespace-only title is rejected on create and on edit.
- **VR-002**: After trimming, the title contains at most 200 characters. A longer title is rejected.
- **VR-003**: Description is optional. An empty description is accepted. After trimming, the description contains at most 5,000 characters. A longer description is rejected.
- **VR-004**: Priority is one of Low, Medium, or High.
- **VR-005**: Status is one of To Do, In Progress, or Done.
- **VR-006**: A create form opens with status To Do and priority Medium. The user can choose another allowed status and another allowed priority before saving. A saved task always has exactly one priority and exactly one status.
- **VR-007**: A validation failure leaves stored tasks unchanged and tells the user the rule that failed: the title is required, the title is too long, or the description is too long.
- **VR-008**: The same title may be used by more than one task. Each task remains distinct for edit, move, and delete.

### Empty States

- **ES-001**: No saved tasks, and at least one status is selected. The user sees that the board has no tasks and is offered a way to create the first task. Each selected status remains visible and shows that it is empty.
- **ES-002**: A selected column contains no visible task. The column keeps its status name and shows that it is empty. This covers a selected column with no saved tasks, and a selected column whose tasks are hidden by the priority filter. An unselected status does not use this state, because its column is hidden.
- **ES-003**: No status is selected. No columns are shown. The user sees that no statuses are selected and is offered a way to clear the filters. Saved tasks stay saved. This state is distinct from ES-001.
- **ES-004**: Confirming deletion of the last saved task selects all three statuses, sets priority to All, and shows ES-001.
- **ES-005**: Saved tasks cannot be loaded. The user is told that the tasks could not be loaded. The board does not show ES-001 or ES-003 for this failure.

### Key Entities *(include if feature involves data)*

- **Task**: One piece of work with a stable identity, a title, a description that may be empty, one priority, and one status. Identity stays the same when the task is edited or moved. Two tasks may share a title.
- **Status**: Where the task sits on the board. The values are To Do, In Progress, and Done. A selected status has a column. Status decides which column holds the task.
- **Priority**: How urgent the task is, relative to other tasks. The values are Low, Medium, and High. The priority filter also offers All, which is a view choice and is not stored on the task.
- **Board**: The single collection of tasks in this browser. Every task belongs to this board. The feature has no second board and no account-specific collection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a valid task and see it in the matching status column in under one minute when that status is selected.
- **SC-002**: After a browser refresh, every saved task is present with the same title, description, priority, and status.
- **SC-003**: After a status change, the task is stored with the new status. When the destination status is selected, the task is visible in the new column and absent from the previous column before the next refresh.
- **SC-004**: In observed deletion attempts, cancelling leaves the selected task in place, and confirming removes that task while leaving every other task in place.
- **SC-005**: Attempts to save a missing, whitespace-only, or over-length title never create a task and never change a stored task.
- **SC-006**: With filters applied, every visible task has a selected status and a priority that matches the priority filter, every non-matching task is hidden, and a column is visible exactly when its status is selected.
- **SC-007**: A user working with only a keyboard can create a task, edit it, move it, change the status and priority filters, clear the filters, and delete a task through confirmation.
- **SC-008**: With all three statuses selected, a user can identify To Do, In Progress, and Done at a narrow viewport and at a desktop viewport, and can create, move, and change filters at both sizes.
- **SC-009**: In a moderated first-use check, at least 90 percent of participants can add a task and find it in the correct column without assistance.
- **SC-010**: With 100 saved tasks, a user can still create a task, edit a task, move a task, delete a task, and change both filters.

## Assumptions

- This specification follows DevFlow Constitution v1.0.0. It defines observable behavior and acceptance criteria. Screen technology, the storage mechanism, and the deployment target remain later architecture decisions. Those decisions are not product questions about this feature's behavior.
- Constitution Principle IV is reflected by FR-015 and FR-016: accessible names, keyboard completion of the critical flow, and a layout that works at a narrow viewport and a desktop viewport.
- Constitution Principle VI is reflected by the acceptance scenarios, AC-001 through AC-019, and the success criteria. Each one can be observed as pass or fail.
- All seven user stories are in scope for this feature. P1, P2, and P3 rank delivery order. They do not remove a story from this feature.
- The original request did not set the initial status and priority, the field lengths, the order inside a column, or whether a filter selection survives a refresh. Those rules are now normative: VR-002, VR-003, VR-006, FR-008, FR-010, and FR-019.
- A new task opens as To Do and Medium, so the only text the user must supply is the title. The user can change either value before saving.
- The board summary shows title and priority. The full description is available when the task is opened.
- A delete confirmation offers one confirm action and one cancel action, and it shows the task title.
- On a wide layout, selected columns appear from left to right in status order. On a narrow layout, the selected columns stay in that order and remain reachable.
- The priority filter is a single choice among All, Low, Medium, and High. The approved status decision makes status multi-select. It leaves priority as one active choice.
- A second open view in this browser shows the same saved tasks after it is refreshed. Live update of the second view is out of scope.
- The current product vision also names analytics and filter fields beyond status and priority. Those items stay under Out of Scope.

## Out of Scope

The following are not part of this feature:

- Due dates, assignees, comments, attachments, labels, subtasks, and search.
- Filter fields other than status and priority.
- Selecting more than one priority at the same time.
- Analytics and reporting.
- Notifications and an activity history.
- Undo after a confirmed deletion.
- Import and export.
- Rearranging tasks inside a column.
- Live updates between two views that are open at the same time.
- Sign-in, accounts, roles, sharing, additional boards, a project list, and a board switcher.
- Showing this browser's tasks in another browser or on another device.
