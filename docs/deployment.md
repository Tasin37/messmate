# Deployment and Operations

## 1. Production components

-   Vercel project for Next.js.
-   Managed PostgreSQL with a pooled connection endpoint.
-   Private object storage for receipts.
-   Optional email/SMS service.
-   Error monitoring and uptime checks.

## 2. Release process

1.  Merge reviewed code to the release branch.
2.  Run lint, unit and integration tests in CI.
3.  Deploy preview and run smoke tests.
4.  Back up production database before risky migrations.
5.  Apply backward-compatible migration.
6.  Deploy application.
7.  Verify auth, dashboard, meal entry, expense, payment and report
    flows.
8.  Monitor errors and database connections.

Prefer expand-and-contract migrations: add new nullable structures
first, deploy compatible code, backfill, then remove obsolete structures
in a later release.

## 3. Database operations

-   Use pooled connection string for serverless runtime.
-   Keep pool sizes conservative.
-   Set connection and statement timeouts.
-   Enable automated backups and point-in-time recovery where available.
-   Test restore into a separate database periodically.
-   Restrict production DB access to required operators.

## 4. File storage

-   Private bucket/container.
-   Short-lived signed URLs.
-   Enforce file-size limits and content validation.
-   Define retention and deletion policy.

## 5. Monitoring

Monitor: - Application errors and latency. - DB connection exhaustion
and slow queries. - Failed authentication spikes. - Failed scheduled
jobs. - Upload failures. - Month-close failures and settlement
reconciliation errors.

## 6. Rollback

Application rollback should not assume database rollback is safe. Use
backward-compatible migrations and documented repair scripts. For
financial data, restore/reconcile carefully; never overwrite newer
transactions without an incident plan.
