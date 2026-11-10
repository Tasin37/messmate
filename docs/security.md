# Security and Privacy Requirements

## 1. Security objectives

Protect account access, isolate each mess's data, prevent unauthorized
financial changes, keep receipts private and preserve trustworthy audit
history.

## 2. Authentication

-   Use Better Auth's supported password/session configuration.
-   Hash passwords using the library's recommended secure algorithm;
    never implement custom password hashing.
-   Use secure, HttpOnly, SameSite cookies and HTTPS in production.
-   Rate-limit login, password reset, invite redemption and OTP
    endpoints.
-   OTP must expire, be single-use and be rate-limited if introduced.
-   Revoke sessions on password reset or account compromise.

## 3. Authorization

-   Enforce authorization on the server for every read and write.
-   Roles: manager and member; define permission matrix centrally.
-   A member can see their own private statement and shared mess
    information, but not edit other members' financial records.
-   Managers can manage mess operations, subject to closed-period rules.
-   Invite tokens are random, stored hashed, expiring, revocable and
    optionally usage-limited.
-   Never rely on hidden UI controls as access control.

## 4. Tenant isolation

-   Resolve mess access from authenticated user membership.
-   Verify `mess_id` and membership on every request.
-   Use tenant-scoped queries and composite foreign keys.
-   Test IDOR cases by changing IDs in URLs and request bodies.
-   Consider PostgreSQL RLS only after validating connection pooling and
    transaction-local tenant context.

## 5. Financial integrity

-   Use DB transactions for financial writes.
-   Prevent writes to closed periods.
-   Use idempotency keys for retry-prone operations.
-   Audit changes to meals, expenses, bills, payments, settlements,
    roles and period status.
-   Financial history must not be silently deleted.
-   Require reason for void, reversal, reopen and manager override.

## 6. File upload security

-   Allow only required MIME types (e.g. JPEG, PNG, PDF); verify actual
    file signature where possible.
-   Enforce file-size and per-mess storage limits.
-   Store privately; use short-lived signed URLs.
-   Generate storage keys server-side; never trust user filenames as
    paths.
-   Scan uploads where a suitable service is available.
-   Check authorization before download.

## 7. Application security

-   Parameterized SQL only.
-   Zod validation on server.
-   CSRF protection according to auth/framework requirements.
-   Content Security Policy and secure headers.
-   Escape untrusted content; avoid unsafe HTML rendering.
-   Protect against XSS, SQL injection, SSRF and open redirects.
-   Do not expose secrets in `NEXT_PUBLIC_*`.
-   Keep dependencies updated and run audit/scanning in CI.

## 8. Privacy and data lifecycle

-   Collect only necessary personal data.
-   Make phone numbers visible only to authorized mess members.
-   Define account deletion/export policy while preserving
    legally/operationally necessary financial records in anonymized or
    restricted form.
-   Backups must be encrypted and access-controlled.
-   Document retention and deletion behavior for receipts, audit events
    and inactive memberships.

## 9. Incident response

-   Maintain a way to revoke sessions and invite links.
-   Record incident timeline and affected tenant scope.
-   Rotate leaked secrets immediately.
-   Restore from verified backup if needed.
-   Notify affected users according to applicable law and the product's
    incident policy.

## 10. Security release checklist

-   [ ] Tenant-isolation tests pass.
-   [ ] Member/manager permission tests pass.
-   [ ] No secrets in repository or client bundle.
-   [ ] Rate limits configured.
-   [ ] Upload validation and private access tested.
-   [ ] Closed-period write protection tested.
-   [ ] Audit events cannot be altered through ordinary application
    routes.
-   [ ] Backup restore has been tested.
