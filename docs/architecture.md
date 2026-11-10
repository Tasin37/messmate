# System Architecture

## 1. High-level design

Use a modular monolith: one Next.js application, one PostgreSQL database
and private object storage. This is simpler to deploy and maintain than
microservices for the initial target of small messes.

``` text
Browser / Mobile PWA-ready UI
        |
        v
Next.js App Router
  |-- Server Components (read views)
  |-- Route Handlers / Server Actions
        |
        v
Application / Domain Services
  |-- Auth & authorization
  |-- Mess & membership
  |-- Meals & meal rate
  |-- Expenses & bills
  |-- Payments & settlement
  |-- Audit & notifications
        |
        +------ PostgreSQL via pg Pool
        |
        +------ Private object storage (receipts)
        |
        +------ Optional email/SMS/push provider
```

## 2. Module boundaries

-   **Identity:** user accounts, sessions and authentication.
-   **Tenant management:** mess, membership, roles, invitations and
    settings.
-   **Operations:** meals, meal-off requests, bazaar roster, shopping
    list and inventory.
-   **Finance:** expenses, recurring bills, deposits, adjustments and
    settlements.
-   **Governance:** audit events, month close/reopen, notices and
    complaints.
-   **Reporting:** dashboard aggregates, monthly statements and exports.

Modules communicate through domain services rather than importing each
other's SQL directly.

## 3. Multi-tenancy

A mess is the tenant boundary. Every tenant-owned table includes
`mess_id`. Every request derives the user's accessible messes from the
authenticated session and membership table; never trust a
client-supplied `mess_id` alone.

Recommended defense in depth: - Explicit tenant predicates in every
repository query. - Composite foreign keys that include `mess_id` where
practical. - Authorization checks in services. - Optional PostgreSQL
Row-Level Security after connection-pooling/session behavior has been
designed and tested. - Cross-tenant integration tests.

## 4. Request flow: create expense

1.  Authenticate request.
2.  Parse Zod schema.
3.  Resolve active membership and permission for target mess.
4.  Check accounting period is open.
5.  Validate payer is an active or historically eligible member.
6.  Begin DB transaction.
7.  Insert expense and optional itemized lines.
8.  Insert audit event.
9.  Commit and return normalized record.

## 5. Request flow: monthly settlement

1.  Select mess and month.
2.  Load approved meals, eligible expenses, bill allocations, deposits,
    credits and adjustments.
3.  Apply the versioned settlement policy.
4.  Calculate using decimal-safe arithmetic.
5.  Persist a settlement snapshot and per-member statement lines.
6.  Manager reviews reconciliation and exceptions.
7.  Close month in a transaction and prevent ordinary changes.

## 6. Manager rotation model

Separate **manager schedule** from **membership role**. A manager
schedule describes who is on duty; role grants permissions. If the
product later wants automatic temporary manager privileges, implement
that as an explicit, audited policy with start/end timestamps and
fallback manager.

## 7. Month closing

A month has status `open`, `review`, `closed` or `reopened`. Close
operation: - Locks the period row. - Recalculates statements. -
Validates totals and unresolved requests. - Saves snapshot and policy
version. - Marks period closed. - Emits audit event.

All financial writes must lock/check the period in the same transaction
to avoid race conditions.

## 8. Deployment topology

-   Next.js app deployed to Vercel.
-   Managed PostgreSQL with pooled connection endpoint.
-   Private object storage for receipts.
-   Optional email/SMS provider.
-   Scheduled job provider for reminders, if enabled.
-   Error monitoring and structured logs.

## 9. Architecture decisions

  -----------------------------------------------------------------------
  Decision                Choice                  Reason
  ----------------------- ----------------------- -----------------------
  Application shape       Modular monolith        MVP simplicity

  Database                PostgreSQL              Transactions,
                                                  constraints, reporting

  SQL layer               `pg` + raw SQL          Explicit control, as
                                                  requested

  Validation              Zod                     Shared runtime schemas

  Auth                    Better Auth             Session/auth management

  Money                   Decimal-safe DB values  Avoid rounding errors

  Tenant isolation        `mess_id` everywhere    Multi-mess support

  Files                   Private object storage  Secure receipts and
                                                  scalable storage
  -----------------------------------------------------------------------
