# Research: Task Management and Kanban Board

Decisions for feature `001-task-kanban-board`. The approved product behavior stays in [spec.md](./spec.md). This file records how that behavior fits the current SvelteKit application.

## Persistence boundary

**Decision**: Store the board in `localStorage` under the key `devflow.board.v1`. The document shape is the contract in [contracts/persistence.md](./contracts/persistence.md). Filters, the open form, and unsaved field values are memory only.

**Rationale**: The approved product is one task collection for this browser, with no accounts and no requirement that another browser show the tasks. The user asked for localStorage for this MVP. A refresh of this origin reads the same key, which satisfies AC-010 and AC-018. Keeping filters out of the document makes a refresh restore all columns and priority All without a second store.

**Alternatives considered**:

- A server database or SvelteKit form action was rejected. It implies an account or a shared host, which FR-017 and FR-018 exclude, and it would change the persistence boundary beyond the request.
- IndexedDB was rejected. It handles more data and structured queries, but the scale target is 100 tasks and the current dependencies do not include an IndexedDB helper. Adding that machinery does not satisfy a requirement that localStorage cannot meet.
- `sessionStorage` was rejected because it does not keep tasks after the browser session ends. The spec requires them after refresh, and a user can refresh in a later visit.
- Cookies were rejected because task text does not belong on every request and the server must not receive this board.

**Consequences**: Data is per origin and per browser profile. Private-mode and quota failures must surface as save or load errors. Server rendering cannot read the board. A later move to accounts or a hosted store needs a new Principle X record before code depends on it. This record is that decision.

## Authentication

**Decision**: This feature has no sign-in, session, account, role, or sharing control.

**Rationale**: Q1 A is the approved access model. The repository has no authentication package. Principle X requires the authentication choice to be written down before code depends on it.

**Alternatives considered**: Adding an account system was the rejected product option. It would expand this feature past one shared browser board.

**Consequences**: Anyone who can open this origin in this browser can read and change the stored tasks. That is the accepted privacy boundary. Task text must still not be written to server logs or rendered as HTML.

## Deployment target

**Decision**: Leave `@sveltejs/adapter-auto` unchanged. Do not name a host and do not describe the app as deployed.

**Rationale**: Constitution technology constraints say the app is not deployed until a deployment exists. This feature does not need a host because the board data stays in the browser.

**Alternatives considered**: Choosing a Node, Cloudflare, or static adapter was rejected. It is a deployment decision, not a board decision, and adapter-auto already builds the app.

**Consequences**: `npm run build` and `npm run preview` remain the way Playwright reaches the board. No hosting configuration is part of implementation.

## Layering

**Decision**: Split the work into `src/lib/tasks/domain.ts`, `src/lib/tasks/storage.ts`, `src/lib/tasks/board.svelte.ts`, and presentational components under `src/lib/tasks/components/`. `src/routes/+page.svelte` wires the rune module to those components and replaces the starter page.

**Rationale**: Constitution Principle III says a component must not both decide a domain rule and write storage. The existing app is one SvelteKit project with shared code imported through `#lib` and `.js` suffixes. Runes are already required for application files by `vite.config.ts`. A `.svelte.ts` module is the Svelte 5 place for shared `$state` outside a component. Pure domain functions run in the existing Node Vitest project without a browser.

**Alternatives considered**:

- Putting load and rules in `+page.svelte` was rejected because it fails Principle III and is hard to test without rendering.
- A Svelte store from `svelte/store` was rejected. The project standard is runes, and a store would be a second state style.
- A remote state library was rejected because it would be a new dependency and the board is local.

**Consequences**: Implementers import domain and storage with the `#lib` alias. Components receive values and callbacks. The rune module is the only production caller of the storage functions.

## SSR and refresh

**Decision**: Do not add a server `load` function for tasks. The page's server HTML shows a status named "Loading tasks". A client `$effect` calls `init()` only when SvelteKit's `browser` flag is true. `init()` reads storage once. On success it sets phase `ready`. On corrupt or unavailable storage it sets phase `load-error`. A normal refresh runs this path again, so filters return to all statuses and priority All while saved tasks remain.

**Rationale**: Principle VIII forbids browser-only APIs during server rendering. localStorage is absent on the server. Showing ES-001 before hydration would claim there are no tasks when the stored board has not been read yet. Showing ES-005 before a read would claim the data is corrupt. A separate loading status avoids both lies. Refresh behavior matches FR-010 because the document has no filter fields and `init()` always starts from the default view.

**Alternatives considered**:

- `onMount` only, with no loading status, was rejected because the server HTML would still need a body and an empty body looks like ES-001.
- Reading a cookie or request header on the server was rejected with the cookie alternative above.
- Hydrating from an inline boot script was rejected. It adds a second path that can diverge from the storage module.

**Consequences**: Automated tests wait until the loading status is gone, then assert a column, ES-001, or ES-005. The loading status is not a product empty state and has no create or clear action.

## Corrupt data and save failure

**Decision**: `loadBoard` returns a result. A missing key returns an empty task list. Unreadable or schema-invalid data returns `corrupt` and performs no write. `saveBoard` catches storage exceptions and returns a failure. The rune module keeps the previous task list and the current form values when save fails, and it shows "The task could not be saved." A failed load shows "Tasks could not be loaded" (ES-005) and does not show ES-001 or ES-003.

**Rationale**: AC-013 and AC-014 require those outcomes. Overwriting corrupt data with an empty document would look like the user deleted every task. Saving into rune state before `setItem` succeeds would show a task that the next refresh cannot find.

**Alternatives considered**:

- An in-app "erase stored data" button was rejected for this feature. The spec does not ask for a repair flow, and a destructive control needs its own confirmation design.
- Partial load of the valid tasks inside a broken document was rejected. It hides the fact that some stored tasks were unreadable and a later save would drop the rest.
- Retrying a failed save automatically was rejected. The user still has the entered values and can submit again.

**Consequences**: A user who hits quota, private-mode blocking, or corrupt JSON cannot reach the old tasks until the stored value is fixed outside this feature. That risk is accepted for the MVP and listed in the plan.

## Identity and column order

**Decision**: Each task has a stable string `id` generated in the rune module with `crypto.randomUUID()`. Domain functions receive the id; they do not generate it. Order uses a numeric `placedAt` that is not displayed. Create sets it. A status change from move or edit sets it to a newer value and the destination column sorts it first. An edit that keeps the status leaves `placedAt` unchanged. Sort is `placedAt` descending, then `id` ascending. The rune module issues `placedAt` from a clock that is at least one greater than the previous value it issued.

**Rationale**: AC-019 needs newest-first, move-to-front, and stable same-status edits. A stored id list can drift from the task list after a partial bug. One timestamp on the task stays consistent on load. Passing ids and timestamps into pure functions keeps `domain.spec.ts` free of `crypto` and `Date`. The monotonic step avoids two tasks created in the same millisecond sorting by id instead of creation.

**Alternatives considered**:

- Sorting only by creation time was rejected because a moved older task would not appear first.
- A per-column id array was rejected as a second structure that must be updated on every create, move, and delete.
- Displaying `placedAt` was rejected because the spec does not show dates.

**Consequences**: `placedAt` is part of the stored task even though the UI hides it. Tests set explicit values. Production code uses the monotonic helper only in the rune module.

## Accessible interaction

**Decision**: Use platform controls and Tailwind utilities already available in the app.

- Status filter: a group of three checkboxes, all checked on open. Any subset, including none, can be checked.
- Priority filter: a radio group with All, Low, Medium, and High. All is the default. Exactly one radio is selected.
- Move: a select on the card, labeled `Status for {title}`, with the three statuses. Changing it saves the move.
- Delete: a modal `dialog` named with the task title, with Confirm delete and Cancel. Cancel and Escape leave the task in place.
- Form: labeled Title, Description, Priority, and Status. Create defaults are To Do and Medium. Save and Cancel are buttons. Field errors use an alert tied to the field.
- Layout: selected columns are in document order. They stack vertically at a narrow width and sit in a row from `md` upward.

**Rationale**: Principle IV and AC-015 require names and a keyboard path. Principle V rejects a widget library when native controls already provide checkboxes, radios, selects, labels, and dialogs. Playwright can operate these roles without coordinate clicks. Stacking columns satisfies AC-016 without a carousel or horizontal trap.

**Alternatives considered**:

- Drag-and-drop as the only move gesture was rejected because it fails the keyboard requirement. Drag-and-drop as an additional gesture was rejected because it needs new behavior and, in practice, a library or a large custom implementation that this MVP does not require.
- A custom modal was rejected. `showModal()` provides the dialog role, focus containment, and Escape.
- A segmented button library for filters was rejected as a new dependency.

**Consequences**: Move is a select change, not a drag. The edit form is also the surface that shows the description. Focus returns to the invoking card control when a dialog or form closes, and to Create task when that card is gone.

## Dependencies

**Decision**: Add no packages and do not change `package.json` or `package-lock.json`.

**Rationale**: Principle V and the user request. Vitest, the Vitest browser project, Playwright, Tailwind 4, and SvelteKit already cover tests, styling, routing, and UI.

**Alternatives considered**: A date library, a UUID library, a drag library, and a form library were rejected. The platform and a few pure functions cover each job.

**Consequences**: Implementation uses `crypto.randomUUID()`, `localStorage`, HTML form elements, `<dialog>`, and Tailwind utilities in the components. No `svelte.config.js` change is required; the Kit plugin is already configured in `vite.config.ts`.

## Verification approach

**Decision**: Map AC-001 through AC-019 to the test files in [plan.md](./plan.md). Domain and storage tests run with `npm run test:unit -- --run`. Component tests use the existing browser project and the `render` helper already used by `src/lib/vitest-examples/Welcome.svelte.spec.ts`. End-to-end tests use `npm run test:e2e`, which builds and previews on port 4173. The starter assertion in `src/routes/page.svelte.e2e.ts` is updated to expect the board heading.

**Rationale**: Principle VII demands a Vitest test for business rules and an automated UI test for critical flows. The repo already splits Node specs from `*.svelte.spec.ts` and already matches `**/*.e2e.ts`. Reusing that split avoids a new runner.

**Alternatives considered**:

- jsdom was rejected. It is not installed, and the client project already uses headless Chromium.
- A single end-to-end file for every validation edge was rejected. Length boundaries are cheaper and more stable as domain tests, with one browser example of the required-title message.

**Consequences**: `npm run check` is required before review. Reported results must come from those commands. SC-009 stays a manual moderated check and is outside the automated suite.
