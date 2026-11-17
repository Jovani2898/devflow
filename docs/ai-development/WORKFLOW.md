# AI-assisted development workflow

This is the way DevFlow is being built with Cursor and Claude Code. It describes the gate a person keeps on AI-written changes.

Spec Kit templates, scripts, and Cursor skills live in [`.specify/`](../../.specify/) and [`.cursor/skills/`](../../.cursor/skills/). They produce specification files. They do not implement product code, review pull requests, or merge changes. This repository has no MCP servers and no automated review bot.

## Instruction files

Cursor and Claude Code are given the same engineering standards.

| Environment | File | How it applies |
| --- | --- | --- |
| Cursor | [`.cursor/rules/project-standards.mdc`](../../.cursor/rules/project-standards.mdc) | Project rule with `alwaysApply: true`. Cursor includes it in every session. |
| Claude Code | [`CLAUDE.md`](../../CLAUDE.md) | Claude Code reads this file from the repository root. |
| Both | [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md) | Constitution v1.0.0. Ratified 2026-11-14. It supersedes conflicting agent improvisation. |

Both files require Svelte 5 runes, TypeScript `strict`, the existing Tailwind CSS 4 setup, SvelteKit server and browser boundaries, `#lib` imports, tests for new behavior, and a written summary after implementation. Both forbid exposing secrets. Both require explicit approval before a commit, push, merge, deploy, file deletion, or new dependency.

## Spec-driven flow

A significant feature follows this order. The links show how far feature `001-task-kanban-board` has gone. Analyze and implement have not been run, and no board code exists.

1. **Specify.** A person writes the behavior, constraints, and acceptance criteria, or approves a draft. The spec names what will not be built in that change. Done for the first feature: [`specs/001-task-kanban-board/spec.md`](../../specs/001-task-kanban-board/spec.md). The requirements checklist is [`checklists/requirements.md`](../../specs/001-task-kanban-board/checklists/requirements.md).
2. **Plan.** The change is broken into an implementation plan that reuses the current SvelteKit routes, `#lib`, Tailwind setup, Vitest projects, and Playwright config. Done for the first feature: [`plan.md`](../../specs/001-task-kanban-board/plan.md), [`research.md`](../../specs/001-task-kanban-board/research.md), [`data-model.md`](../../specs/001-task-kanban-board/data-model.md), [`contracts/`](../../specs/001-task-kanban-board/contracts/), and [`quickstart.md`](../../specs/001-task-kanban-board/quickstart.md).
3. **Tasks.** The plan is split into dependency-ordered tasks. Done for the first feature: [`tasks.md`](../../specs/001-task-kanban-board/tasks.md).
4. **Analyze.** The spec, plan, and tasks are checked against each other before implementation. Not run for the first feature.
5. **Implement.** Cursor or Claude Code reads the relevant files first, then edits only the approved scope. The agent uses dependencies already declared in `package.json`. Not started. The home page is still the SvelteKit starter.
6. **Verify.** The agent runs the checks that match the change and reports the real command output. See the commands below.
7. **Review.** A person reads the diff against the acceptance criteria, reruns the checks, and decides whether the change is accepted.

Product work waits for this gate. Analytics has no specification. Task management and the Kanban board have a specification and no product code.

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

The tests in the repository today are the Svelte CLI samples under `src/lib/vitest-examples/` and a smoke test in `src/routes/page.svelte.e2e.ts`. Passing them only shows that the shell and the test runner work.

## Current boundaries

- Node.js 22.17 or newer is required by the installed SvelteKit release.
- Shared modules are imported through `#lib`, with the file extension.
- Styling goes through `@import 'tailwindcss'` in `src/routes/layout.css`.
- The configured adapter is `@sveltejs/adapter-auto`. No host is selected, and the app is not deployed.
- Secrets stay out of the repository. `.gitignore` ignores `.env` and `.env.*`, except `.env.example` and `.env.test`.
