# Contributing Guide

## 1. Workflow

-   Create a branch from the main development branch.
-   Use focused branches: `feat/meal-entry`, `fix/settlement-rounding`.
-   Keep pull requests small and explain the user-visible impact.
-   Update docs when changing behavior, schema, API or accounting rules.

## 2. Code standards

-   JavaScript ES modules.
-   Prefer Server Components unless browser interactivity is required.
-   Keep domain logic in services, not React components.
-   Validate untrusted input with Zod.
-   Use parameterized SQL.
-   Use descriptive names and avoid hidden global state.
-   Never use floating-point arithmetic for money.
-   Keep timezone handling explicit.

## 3. Database changes

-   Add a new sequential SQL migration.
-   Include constraints and indexes.
-   Never modify an already-applied migration.
-   Include migration tests and update `database.md`.

## 4. Pull-request checklist

-   [ ] Requirements and edge cases described.
-   [ ] Tests added or updated.
-   [ ] Lint and build pass.
-   [ ] Authorization and tenant scope reviewed.
-   [ ] Financial operations are transactional.
-   [ ] Audit events included where required.
-   [ ] Documentation updated.
-   [ ] No secrets or personal production data included.
