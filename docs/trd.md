# Technical Requirements Document (TRD)

## 1. Target stack

The requested baseline is:

-   Next.js `16.3.8` with App Router
-   React `19.2.8`
-   JavaScript ES modules
-   Tailwind CSS 4, PostCSS and custom CSS
-   PostgreSQL
-   Node.js `pg` driver
-   Raw SQL migrations in `db/migrations/`
-   Better Auth `1.7.7`
-   Zod `4.6.5`
-   ESLint 9 with Next.js configuration
-   Node.js built-in test runner
-   npm and `package-lock.json`
-   Vercel-compatible deployment

**Version gate:** Before implementation, verify that every requested
version exists, is mutually compatible and is available in the chosen
registry. Do not silently install a different major/minor version.
Record the exact resolved versions in `package-lock.json`.

## 2. Runtime and application structure

Use the Next.js App Router. Server Components are the default. Use
Client Components only for interactive forms, charts, dialogs,
language/theme controls and other browser interactions.

Suggested structure:

``` text
src/
  app/
    (auth)/
    (dashboard)/
    api/
  components/
    ui/
    forms/
    charts/
  features/
    auth/
    messes/
    members/
    meals/
    expenses/
    bills/
    payments/
    settlements/
    notifications/
  lib/
    auth/
    db/
    permissions/
    validation/
    money/
    dates/
  server/
    services/
    repositories/
  styles/
db/
  migrations/
  seeds/
tests/
  unit/
  integration/
  e2e/
```

## 3. Architectural rules

-   UI components must not contain accounting calculations.
-   Route handlers/server actions validate inputs with Zod and call
    domain services.
-   Domain services enforce business rules and authorization.
-   Repositories own SQL statements and parameter binding.
-   Use PostgreSQL transactions for multi-row financial operations.
-   Never concatenate user input into SQL.
-   Keep all tenant-scoped repository methods explicit about `messId`.
-   Use `NUMERIC(14,2)` or integer paisa for BDT amounts; never
    JavaScript floating-point arithmetic for money.
-   Store timestamps in `timestamptz`; render using mess timezone.
-   Use UUID primary keys.
-   Prefer soft deactivation for members and audit-preserving reversals
    for financial data.

## 4. Database access

Use `pg` Pool with connection limits suitable for serverless execution.
Vercel deployments may create many short-lived instances; use a
provider's pooled connection endpoint (or a serverless-compatible
pooler) and keep transactions on one checked-out client. Do not execute
transaction statements through unrelated pool connections.

A repository method should follow this pattern:

1.  Acquire a client.
2.  Begin transaction.
3.  Verify mess membership and permission inside the transaction.
4.  Perform parameterized SQL writes.
5.  Insert audit event.
6.  Commit; rollback on error.
7.  Release client in `finally`.

## 5. Authentication

Integrate Better Auth using its documented Next.js adapter and
PostgreSQL support. Keep auth tables and product-domain tables logically
separated. Verify the installed Better Auth version's current
configuration and migration guidance before coding; do not assume API
names from another release.

## 6. Validation and errors

-   Zod schemas validate request bodies, query parameters and
    environment variables.
-   Return stable error codes, not raw SQL or stack traces.
-   Use consistent response shape: `{ data }` for success and
    `{ error: { code, message, fieldErrors? } }` for failure.
-   Validate amount \> 0, date range, active membership, category
    ownership and file metadata.
-   Make payment/expense creation idempotent where clients may retry.

## 7. File storage

Do not store uploaded receipt binaries in PostgreSQL. Store in private
object storage (e.g. Vercel Blob or compatible S3 provider), with
database metadata and an opaque object key. Use signed upload/download
URLs, content-type and size validation, and authorization before issuing
downloads.

## 8. Background tasks

MVP reminders may be generated in-app when users load the dashboard.
Scheduled email/push reminders require a reliable scheduler/queue or
cron integration and idempotent jobs. Do not rely on a serverless
process remaining alive after a response.

## 9. Observability

Log request ID, mess ID, actor ID, operation and outcome. Do not log
passwords, session tokens, OTPs, full receipt URLs or sensitive payment
references. Add error monitoring and database health checks before
production.

## 10. Performance targets

-   Primary dashboard server response target: p95 \< 1.5s under expected
    MVP load, excluding cold start and third-party latency.
-   Paginate audit logs, expenses and member lists.
-   Add indexes for common tenant/date/member queries.
-   Avoid N+1 queries in dashboard and monthly statement views.
-   Cache only non-sensitive, safely invalidated reference data; do not
    cache user-specific financial totals across tenants.
