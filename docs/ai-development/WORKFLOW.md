# AI-assisted development workflow

This is the way DevFlow is built with Cursor and Claude Code. It describes the gate a person keeps on AI-written changes, and how far feature `001-task-kanban-board` has gone.

Spec Kit templates, scripts, and Cursor skills live in [`.specify/`](../../.specify/) and [`.cursor/skills/`](../../.cursor/skills/). They produce and check specification files, and the implement skill edits code from `tasks.md`. They do not review pull requests or merge changes. This repository has no MCP servers and no automated review bot.

## Instruction files

Cursor and Claude Code are given the same engineering standards.

| Environment | File | How it applies |
| --- | --- | --- |
| Cursor | [`.cursor/rules/project-standards.mdc`](../../.cursor/rules/project-standards.mdc) | Project rule with `alwaysApply: true`. Cursor includes it in every session. |
| Claude Code | [`CLAUDE.md`](../../CLAUDE.md) | Claude Code reads this file from the repository root. |
| Both | [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md) | Constitution v1.0.0. Ratified 2026-11-14. It supersedes conflicting agent improvisation. |

Both files require Svelte 5 runes, TypeScript `strict`, the existing Tailwind CSS 4 setup, SvelteKit server and browser boundaries, `#lib` imports, tests for new behavior, and a written summary after implementation. Both forbid exposing secrets. Both require explicit approval before a commit, push, merge, deploy, file deletion, or new dependency.

## Spec-driven flow

A significant feature follows this order. Feature `001-task-kanban-board` has completed it through convergence.

1. **Specify.** A person writes the behavior, constraints, and acceptance criteria, or approves a draft. The spec names what will not be built in that change. Done: [`specs/001-task-kanban-board/spec.md`](../../specs/001-task-kanban-board/spec.md). The requirements checklist is [`checklists/requirements.md`](../../specs/001-task-kanban-board/checklists/requirements.md). Approved product decisions: one shared browser collection with no accounts, exactly one board, and a status filter that can select any combination of columns.
2. **Plan.** The change is broken into an implementation plan that reuses the current SvelteKit routes, `#lib`, Tailwind setup, Vitest projects, and Playwright config. Done: [`plan.md`](../../specs/001-task-kanban-board/plan.md), [`research.md`](../../specs/001-task-kanban-board/research.md), [`data-model.md`](../../specs/001-task-kanban-board/data-model.md), [`contracts/`](../../specs/001-task-kanban-board/contracts/), and [`quickstart.md`](../../specs/001-task-kanban-board/quickstart.md).
3. **Tasks.** The plan is split into dependency-ordered tasks. Done: [`tasks.md`](../../specs/001-task-kanban-board/tasks.md), T001 through T064.
4. **Analyze.** The spec, plan, and tasks are checked against each other and Constitution v1.0.0 before implementation. Done. The findings that required task or plan text were applied before implementation. The intentional overlap of FR-012 and FR-013 was kept.
5. **Implement.** Cursor read the approved tasks and implemented them in order: domain, storage, rune state, accessible UI, and Vitest and Playwright coverage. No new dependency was added. The board lives in `src/lib/tasks/` and `src/routes/+page.svelte`.
6. **Verify.** The implementation run used `npm run check`, `npm run build`, `npm run test:unit -- --run`, and Playwright. A later publication run records its own command output separately. SC-001 has no timed measurement. SC-009 remains a manual study and has not been run.
7. **Independent review.** Claude Code reviewed the uncommitted implementation without editing it. The record is [`reviews/001-task-board-review.md`](reviews/001-task-board-review.md). Two defects were confirmed: a failed delete hid the save error behind the dialog, and a failed move could leave the status select on an unsaved value.
8. **Fix.** The delete dialog now shows the save error and keeps the task for another attempt. The status select returns to the saved status when the move is not stored. Regression tests cover both failures and the storage exceptions used to reproduce them.
9. **Converge.** Spec Kit compared the code with the specification, plan, and tasks. No remaining feature task was appended. The plan note that said UI components do not validate length was later corrected, because the form calls the domain validator before it forwards a save.
10. **Human review.** A person reads the diff against the acceptance criteria, reruns the checks, and decides whether the change is accepted. Publication to GitHub is a separate approval from implementation.

Product work still waits for this gate. Analytics has no specification. The Kanban board is the implemented MVP described in the specification, and the app is not deployed.

The human approval and verification steps stay in place. Spec Kit skills do not replace them.

## Human review

The person reviewing a change checks four things:

- The diff matches the approved specification and does not add unrequested product scope.
- Server-only code stays off the client, and browser APIs stay in browser code.
- New business logic has a Vitest spec, and new UI behavior has a component spec or a Playwright test when that behavior is user-visible.
- The summary lists the files that changed, the commands that actually ran, and any risk that was not checked.

A review is not an automated status check. Nothing in this repository posts review comments, approves pull requests, or blocks merges.

Agents do not invent test output. If a command was not run, the summary says it was not run.

## Verification commands

These are the scripts in `package.json`. There is no lint or format script.

| Command | Use it for |
| --- | --- |
| `npm run check` | Types and Svelte diagnostics. Runs `svelte-kit sync` and `svelte-check --tsconfig ./tsconfig.json`. |
| `npm run build` | Production build through Vite. |
| `npm run test:unit -- --run` | One Vitest run. The client project runs `src/**/*.svelte.{test,spec}.{js,ts}` in headless Chromium. The server project runs other `src/**/*.{test,spec}.{js,ts}` files in Node. |
| `npm run test:e2e` | Installs Playwright browsers, then runs files matching `**/*.e2e.{ts,js}`. Playwright builds the app and serves the preview on port 4173. |
| `npm run test` | Unit tests once, then `npm run test:e2e`. |

`npm run test:unit` without `--run` starts Vitest in watch mode and does not exit on its own. `npm run dev` and `npm run preview` are for a person looking at the app. They are not substitutes for `npm run check` or the test scripts.

Product coverage lives in `src/lib/tasks/**/*.spec.ts` and `src/routes/board.e2e.ts`. The Svelte CLI samples under `src/lib/vitest-examples/` are still present and are not the board tests.

## Current boundaries

- Node.js 22.17 or newer is required by the installed SvelteKit release.
- Shared modules are imported through `#lib`, with the file extension.
- Styling goes through `@import 'tailwindcss'` in `src/routes/layout.css`.
- The configured adapter is `@sveltejs/adapter-auto`. No host is selected, and the app is not deployed.
- Secrets stay out of the repository. `.gitignore` ignores `.env` and `.env.*`, except `.env.example` and `.env.test`.
