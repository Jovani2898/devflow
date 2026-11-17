# DevFlow

DevFlow is a project-management application in development. The product is planned to provide Kanban boards, task management, priorities, filters, and analytics.

The repository today is the SvelteKit application shell, test tooling, and a written spec-driven workflow for Cursor and Claude Code. The first feature, task management and a Kanban board, has an approved specification, plan, and task list. Its product code is not written. Analytics is not specified. There is no public deployment and no live demo.

## Status

| Area | State |
| --- | --- |
| SvelteKit application shell, TypeScript, Tailwind CSS, Vitest, Playwright | Done |
| Cursor and Claude Code instruction files | Done |
| [DevFlow Constitution](.specify/memory/constitution.md) v1.0.0 | Ratified |
| Spec Kit templates, scripts, and Cursor skills | Present in the repo |
| Task management and Kanban board | Specified and planned. In development. No product code yet. |
| Analytics | Not specified |
| Screenshots and live demo | Not available |

## Product vision

DevFlow is planned as a focused board for day-to-day project work:

- **Kanban boards** for moving work across columns.
- **Tasks** with a clear title, description, and status.
- **Priorities** so the next piece of work is obvious.
- **Filters** for narrowing a board by status, priority, and related fields.
- **Analytics** for a simple view of where work is accumulating.

Task management and the Kanban board have an approved specification. Analytics does not. Nothing in `src/routes` implements product behavior. The home page is the SvelteKit starter page.

## Technology stack

Versions below are the ones installed in `package-lock.json`. `package.json` declares compatible ranges. Every dependency is a dev dependency, and the package is marked `"private": true`, so it is not an npm library.

| Technology | Installed | Role |
| --- | --- | --- |
| Node.js | 22.17 or newer | Required by `@sveltejs/kit@3.2.0` (`engines.node`) |
| SvelteKit | 3.2.0 | Application framework. Configuration lives in `vite.config.ts`. Shared code is imported as `#lib`. |
| Svelte | 5.57.3 | UI. Runes are enabled for application files. |
| TypeScript | 6.0.3 | `strict` is on in `tsconfig.json`. Checked with `svelte-check`. |
| Vite | 8.3.8 | Dev server and production build |
| Tailwind CSS | 4.3.5 | `@import 'tailwindcss'` in `src/routes/layout.css`, through `@tailwindcss/vite` |
| Vitest | 4.1.12 | Unit tests in Node, component tests in headless Chromium |
| Playwright | 1.65.1 | End-to-end tests |
| `@sveltejs/adapter-auto` | 8.0.1 | Default adapter. No hosting target is selected. |

`npm` is the package manager. `.npmrc` sets `engine-strict=true`. There is no ESLint config, Prettier config, database, authentication package, or deployment config.

## Repository layout

```text
src/routes/+page.svelte          Starter page
src/routes/+layout.svelte        Root layout
src/routes/layout.css            Tailwind entry
src/routes/page.svelte.e2e.ts    Playwright smoke test for the starter page
src/lib/                         Shared modules, imported as #lib
src/lib/vitest-examples/         CLI sample tests, not product behavior
docs/ai-development/WORKFLOW.md  AI development workflow used so far
.specify/memory/constitution.md  Constitution v1.0.0
.cursor/rules/project-standards.mdc
.cursor/skills/                   Spec Kit skills for Cursor
CLAUDE.md
specs/001-task-kanban-board/      First feature spec, plan, and tasks
```

## AI-assisted engineering

Feature work follows a written spec-driven sequence. A person approves the specification and acceptance criteria before an agent implements a significant feature. Cursor and Claude Code use the same engineering standards. The sequence has been used to specify and plan the first feature. It has not been used to implement that feature, and it does not approve or merge changes by itself.

| Tool | Instruction file | What it does today |
| --- | --- | --- |
| Cursor | [`.cursor/rules/project-standards.mdc`](.cursor/rules/project-standards.mdc) | Always-on project rule (`alwaysApply: true`) |
| Claude Code | [`CLAUDE.md`](CLAUDE.md) | Root project instructions. Same standards as the Cursor rule. |
| Spec Kit | [`.specify/`](.specify/) and [`.cursor/skills/`](.cursor/skills/) | Templates, Constitution, and skills for specify, plan, tasks, analyze, and implement |

The process, review gate, and verification commands are in [docs/ai-development/WORKFLOW.md](docs/ai-development/WORKFLOW.md).

### Documents for the first feature

Task management and the Kanban board are specified. Implementation has not started.

| Document | Path |
| --- | --- |
| Constitution v1.0.0 | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| Specification | [`specs/001-task-kanban-board/spec.md`](specs/001-task-kanban-board/spec.md) |
| Requirements checklist | [`specs/001-task-kanban-board/checklists/requirements.md`](specs/001-task-kanban-board/checklists/requirements.md) |
| Implementation plan | [`specs/001-task-kanban-board/plan.md`](specs/001-task-kanban-board/plan.md) |
| Research and decisions | [`specs/001-task-kanban-board/research.md`](specs/001-task-kanban-board/research.md) |
| Data model | [`specs/001-task-kanban-board/data-model.md`](specs/001-task-kanban-board/data-model.md) |
| Persistence contract | [`specs/001-task-kanban-board/contracts/persistence.md`](specs/001-task-kanban-board/contracts/persistence.md) |
| UI contract | [`specs/001-task-kanban-board/contracts/board-ui.md`](specs/001-task-kanban-board/contracts/board-ui.md) |
| Validation guide | [`specs/001-task-kanban-board/quickstart.md`](specs/001-task-kanban-board/quickstart.md) |
| Implementation tasks | [`specs/001-task-kanban-board/tasks.md`](specs/001-task-kanban-board/tasks.md) |

These are not set up:

- MCP servers
- Automated review bots
- Product code for the board

## Human review

An agent may draft code. A person decides whether it lands.

- Significant work starts from an approved specification and acceptance criteria.
- Agents inspect the existing code and stay inside the current dependencies.
- Agents do not commit, push, merge, deploy, delete files, or install packages unless a person explicitly asks.
- The reviewer compares the diff with the specification and reruns the checks below. Reported results have to come from those commands.

## Local development

Use Node.js 22.17 or newer, then install from the lockfile:

```sh
npm install
```

| Command | What it runs |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run dev -- --open` | Development server, then open a browser |
| `npm run check` | `svelte-kit sync` and `svelte-check` |
| `npm run check:watch` | The same check, watching for changes |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run test:unit` | Vitest in watch mode |
| `npm run test:unit -- --run` | Vitest once, then exit |
| `npm run test:e2e` | `playwright install`, then Playwright |
| `npm run test` | Unit tests once, then the end-to-end script |

`npm run test:unit` stays open because the script is `vitest` with no `--run` flag. The first `npm run test:e2e` downloads Playwright browsers. `npm run prepare` runs `svelte-kit sync` on install.

The current automated tests are scaffold samples: a `greet` unit test, a `Welcome` component test, and a Playwright check that the starter page has a visible `h1`. They do not cover product behavior.

## Roadmap

1. **Foundation.** Application shell, TypeScript, Tailwind CSS, Vitest, Playwright, Constitution, and agent instruction files. Done.
2. **Spec workflow.** Spec Kit templates and skills are in the repo. The first feature has a specification, plan, and task list. Analyze and implement have not been run.
3. **Board core.** Task management, the Kanban board, priorities, and filters. In development: the specification is approved, and the product code is not written.
4. **Analytics.** A small reporting view of board activity. Not specified. It waits until the board data exists.
5. **Portfolio evidence.** Screenshots and a live demo after the product UI exists. Not available.

## Screenshots

Screenshots will be added here after the board UI exists. The running page is still the SvelteKit starter.

## Live demo

No deployment exists, so there is no demo URL.
