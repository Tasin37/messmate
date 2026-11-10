# Testing Strategy

## 1. Test pyramid

-   Unit tests: money calculations, meal rate, allocation, proration,
    rotation and validation.
-   Integration tests: repositories, transactions, authorization and
    tenant isolation against PostgreSQL.
-   End-to-end tests: manager/member journeys in a browser.
-   Manual exploratory tests: mobile layouts, Bangla text, upload and
    poor-network behavior.

Use Node.js built-in test runner as requested. Use a browser automation
tool only if the project later adds one; do not claim E2E coverage
without it.

## 2. Essential unit tests

### Meal rate

-   Eligible meal expenses / meal units.
-   Zero meals.
-   No eligible expenses.
-   Voided expense excluded.
-   Shared-cost category excluded.
-   Decimal rounding and residual handling.

### Settlement

-   Member with meals and no payments.
-   Member with payments and no meals.
-   Member paid bazaar expense and receives credit.
-   Guest meal attributed to host exactly once.
-   Shared bill equal split.
-   Weighted and custom allocation.
-   Join/leave proration.
-   Positive, negative and zero balance wording.
-   Allocation totals reconcile exactly.

### Manager rotation

-   1-day and 7-day rotation.
-   Custom interval.
-   Monthly rotation across year boundary.
-   Inactive member in sequence.
-   Manual override and overlapping schedule rejection.

## 3. Integration tests

-   User can belong to multiple messes.
-   A user cannot access another mess by guessing a UUID.
-   Member cannot edit another member's meal or payment.
-   Manager can approve meal-off request.
-   Closed period rejects financial writes.
-   Expense and audit event commit or rollback together.
-   Duplicate idempotency key does not create duplicate payment.
-   Composite foreign keys prevent cross-mess references.
-   Invite expiry, revocation and max-use behavior.

## 4. End-to-end scenarios

1.  Create mess → invite member → member joins.
2.  Enter meals for multiple days.
3.  Record bazaar expenses and upload a receipt.
4.  Create recurring bills and confirm allocation.
5.  Record deposits using cash/bKash/Nagad labels.
6.  Review member settlement and export report.
7.  Close period and verify edit is blocked.
8.  Reopen with reason and verify audit trail.
9.  Switch language and theme on mobile viewport.

## 5. Test data

Create deterministic fixtures with: - One mess, one manager and three
members. - A mix of join/leave dates. - Multiple meal slots and guest
meals. - Food and shared-cost expenses. - Rent and utility bills. - Cash
and mobile-wallet deposits. - One member with a positive due and one
with an advance.

Never use real phone numbers or payment references in fixtures.

## 6. Quality gates

Before merge: - Lint passes. - Unit tests pass. - Integration tests pass
against a disposable PostgreSQL database. - Migrations run from empty
database. - No high-severity dependency issue without documented
acceptance. - Critical user journeys manually verified on mobile. -
Settlement reconciliation test passes exactly to currency precision.

## 7. Regression policy

Every production bug must produce a failing automated test before or
alongside the fix. Any change to accounting rules requires updating
`business-rules.md`, calculation tests and policy version.
