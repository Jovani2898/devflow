# DevFlow Constitution

## Core Principles

### I. Maintainable SvelteKit Architecture

Product UI MUST be built as SvelteKit 3 routes and layouts, using Svelte 5 runes.
Shared code MUST be imported through `#lib`. A change fails review when it adds a
second UI framework, a second router, or a component style that bypasses SvelteKit.

### II. Strict TypeScript

`compilerOptions.strict` MUST stay enabled in `tsconfig.json`. A change that adds
or edits TypeScript or Svelte code MUST pass `npm run check` before review.

### III. Separated Responsibilities

Business rules MUST live outside Svelte components. Components MUST render state
and forward user actions. Persistence MUST go through a dedicated module, not
through storage calls placed directly in a component. A change fails review when
one component both decides a domain rule and writes stored data.

### IV. Accessible, Responsive Interfaces

Every interactive control in a changed view MUST have an accessible name. A person
MUST be able to complete a changed critical flow with the keyboard. The changed
layout MUST remain usable at a narrow viewport and at a desktop viewport. Review
MUST record those three checks for the changed UI.

### V. Minimal Dependencies

A dependency MUST NOT be added when a package already declared in `package.json`
provides the needed capability. A proposed dependency MUST name that capability
and MUST be approved by a person before it is installed.

### VI. Measurable Acceptance Criteria

A significant feature MUST have acceptance criteria written before implementation.
Each criterion MUST be observable as pass or fail. Work that cannot be checked
against one of those criteria is outside the change.

### VII. Tested Logic and Critical Flows

A change to business logic MUST include a Vitest test that fails when the rule is
wrong. A critical user flow MUST include an automated UI test that exercises that
flow. A change fails review when those tests are missing, or when a reported test
result did not come from a command that was run.

### VIII. SSR, Security, and Privacy

Server-only code MUST NOT be imported by client components. Browser-only APIs MUST
NOT run during server rendering. Secrets MUST NOT be committed. Data that a user
is not allowed to see MUST NOT be logged or included in a client payload. A change
fails review when any of these boundaries is crossed.

### IX. Human Review Before Significant Merges

A significant change MUST NOT be merged until a person has compared the diff with
the approved acceptance criteria and accepted it. Smaller git restrictions in the
agent instruction files remain in force. This principle decides the merge.

### X. Recorded Architecture Decisions

A decision that changes the stack, the persistence boundary, authentication, or
the deployment target MUST be written in the repository before code that depends
on it is merged. The record MUST state the decision, the reason, and the
consequences. Later work MUST follow that record until a newer record replaces it.

## Technology Constraints

Dependency versions MUST come from `package-lock.json` until a person approves a
dependency change. Node.js MUST be 22.17 or newer. The application stack is
SvelteKit, Svelte, TypeScript, Vite, Tailwind CSS, Vitest, and Playwright.
`@sveltejs/adapter-auto` is the configured adapter, and the app MUST NOT be
described as deployed until a deployment exists. Command-level agent rules stay in
`.cursor/rules/project-standards.mdc`, `CLAUDE.md`, and
`docs/ai-development/WORKFLOW.md`. Those files MUST NOT contradict this
constitution.

## Spec-Driven Delivery

Kanban boards, tasks, priorities, filters, and analytics MUST each wait for an
approved specification. A significant change follows this order: write measurable
acceptance criteria, plan the change against the current architecture, implement
only that scope, then submit it for the review in Principle IX. Product code MUST
NOT be written to satisfy a feature that has no such specification.

## Governance

This constitution supersedes conflicting agent improvisation. Amendments MUST be
made in `.specify/memory/constitution.md`, MUST change the semantic version, and
MUST be approved by a person before they are committed. A MAJOR bump removes or
redefines a principle. A MINOR bump adds a principle or materially expands a rule.
A PATCH bump clarifies wording without changing the rule. Compliance review MUST
check the ten principles above.

**Version**: 1.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
