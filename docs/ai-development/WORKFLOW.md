# AI-assisted development workflow

This is the planned way DevFlow will be built with Cursor and Claude Code. It describes the gate a person keeps on AI-written changes.

Spec Kit is the intended home for specifications, plans, and tasks. It is not installed. This repository has no Spec Kit templates, no Spec Kit commands, no MCP servers, no custom agent skills, and no automated review bot.

## Instruction files

Cursor and Claude Code are given the same engineering standards.

| Environment | File | How it applies |
| --- | --- | --- |
| Cursor | [`.cursor/rules/project-standards.mdc`](../../.cursor/rules/project-standards.mdc) | Project rule with `alwaysApply: true`. Cursor includes it in every session. |
| Claude Code | [`CLAUDE.md`](../../CLAUDE.md) | Claude Code reads this file from the repository root. |

Both files require Svelte 5 runes, TypeScript `strict`, the existing Tailwind CSS 4 setup, SvelteKit server and browser boundaries, `#lib` imports, tests for new behavior, and a written summary after implementation. Both forbid exposing secrets. Both require explicit approval before a commit, push, merge, deploy, file deletion, or new dependency.

## Planned spec-driven flow

[GitHub Spec Kit](https://github.com/github/spec-kit) is planned, not configured. Until it is added, a significant feature still follows the same order:

1. **Specify.** A person writes the behavior, constraints, and acceptance criteria, or approves a draft. The spec names what will not be built in that change.
2. **Plan.** The change is broken into a short implementation plan that reuses the current SvelteKit routes, `#lib`, Tailwind setup, Vitest projects, and Playwright config.
3. **Implement.** Cursor or Claude Code reads the relevant files first, then edits only the approved scope. The agent uses dependencies already declared in `package.json`.
4. **Verify.** The agent runs the checks that match the change and reports the real command output. See the commands below.
5. **Review.** A person reads the diff against the acceptance criteria, reruns the checks, and decides whether the change is accepted.

Product work waits for this gate. Kanban boards, tasks, priorities, filters, and analytics do not have specifications yet, and no product code has been written for them.

When Spec Kit is added, it should store those specifications and task lists in the repository. Adding it still requires explicit approval, because it is a new tool and may bring new dependencies. The human approval and verification steps stay in place after that.

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
