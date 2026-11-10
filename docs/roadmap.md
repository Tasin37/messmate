# Product Roadmap

A practical solo-developer sequence. Estimates are indicative and depend
on available hours and design complexity.

## Phase 0 --- Product decisions and setup 

-   Confirm accounting policy: meal-pool categories, guest attribution,
    rent proration, cutoff and rounding.
-   Verify requested package versions and compatibility.
-   Create repository, Next.js app, linting and test runner.
-   Configure local PostgreSQL and migration runner.
-   Add CI checks.

**Exit:** clean app boots locally; migrations and tests run.

## Phase 1 --- Identity and mess foundation 

-   Better Auth integration.
-   User profile.
-   Create mess and switch mess.
-   Membership and invitation flow.
-   Manager/member permissions.
-   Audit-log foundation.

**Exit:** isolated messes and role enforcement tested.

## Phase 2 --- Meals and daily operations 

-   Meal slots and daily meal entry.
-   Guest meal handling.
-   Meal-off request and approval.
-   Manager rotation schedule.
-   Meal history and totals.

**Exit:** a full month of meals can be entered and reviewed.

## Phase 3 --- Bazaar and expenses 

-   Expense categories and entry.
-   Payer/receipt metadata.
-   Private receipt upload.
-   Bazaar roster and shopping list.

**Exit:** expense records are auditable and correctly classified.

## Phase 4 --- Shared bills and payments 

-   Dedicated "Boss" panel to control shared bills like apartment rent, electricity bill,      internet bill, maid (bua) bill, others.
-   Recurring bill templates.
-   Equal/weighted/custom allocations.
-   Deposits and payment methods.
-   Reversal and correction flow.

**Exit:** all monthly charges and payments can be recorded.

## Phase 5 --- Settlement and reports 

-   Meal rate service.
-   Member settlement calculation.
-   Statement drill-down.
-   Reconciliation and rounding policy.
-   Month review/close/reopen.
-   PDF/CSV export.

**Exit:** independent fixtures confirm every member balance and totals
reconcile.

## Phase 6 --- Dashboard and polish 

-   Dashboard summaries and charts.
-   Responsive mobile UX.
-   Bangla/English localization.
-   Dark mode and empty/error states.

**Exit:** core workflows are usable on phone.

## Phase 7 --- Notifications and extended features (later)

-   In-app reminders and notification preferences.
-   Email/push/SMS provider integration.
-   Inventory, complaints/suggestions, richer notices.
-   PWA enhancements and offline-friendly drafts.
-   Advanced reports and optional OCR.

## Launch checklist

-   [ ] Production database and pooled connection configured.
-   [ ] Backups and restore test completed.
-   [ ] Domain, HTTPS and security headers configured.
-   [ ] Auth callback URLs and secrets configured.
-   [ ] Private storage and file limits configured.
-   [ ] Error monitoring and operational alerts configured.
-   [ ] Admin support and data export process documented.
-   [ ] At least one real mess pilot completes a month-end close.
