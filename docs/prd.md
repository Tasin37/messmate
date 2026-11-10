# Product Requirements Document (PRD)

## 1. Overview

**Product name:** Mess Manager\
**Product type:** Responsive web application / installable PWA-ready
experience\
**Primary audience:** Bachelor messes, shared flats and small student
accommodation groups in Bangladesh.

Mess Manager replaces notebooks, spreadsheets and scattered chat
messages with a shared, transparent record of daily meals, shopping,
household bills and member payments.

## 2. Problem statement

Mess members often calculate meal counts and expenses manually. This
causes disputes about who ate how many meals, who paid for shopping, how
rent and utilities are divided, whether a member has a due or advance,
and which manager made a change. The product must make these
calculations repeatable, inspectable and auditable.

## 3. Goals

-   Record daily meals for each active member, including guest meals.
-   Record bazaar purchases with payer, amount, category, details and
    receipt.
-   Split fixed/shared bills using configurable allocation methods.
-   Record deposits and payment methods.
-   Calculate a transparent monthly statement for every member.
-   Support manager/member permissions and manager scheduling.
-   Support multiple messes per user with invite-based joining.
-   Work well on low-to-mid-range mobile devices and variable network
    connections.

## 4. Non-goals for MVP

-   Full accounting/ERP or tax filing.
-   Direct bKash/Nagad payment processing or bank integration.
-   Automatic OCR-based receipt extraction.
-   Native Android/iOS apps.
-   Payroll, rent collection gateway or automatic money transfer.
-   Public social network or marketplace.

## 5. Personas

### Manager

Creates the mess, invites members, sets the month and meal rules,
enters/approves records, manages bills, reviews settlements, closes the
month and exports reports.

### Member

Views their own meal and financial records, enters their meals if
allowed, submits meal-off requests, records suggestions and sees
notices. Members must not edit another member's records or mess-wide
financial settings.

### Treasurer / Assistant manager (future-ready)

A delegated role that can manage expenses or payments without full
owner-level access. MVP can implement this as a permission set or defer
it.

## 6. Functional requirements

### FR-01 Authentication and profile

-   Email/password or phone/password authentication initially; OTP can
    be added after selecting an SMS provider.
-   User profile: display name, phone, optional email and avatar.
-   Session management, password reset and account deactivation.
-   A user can join multiple messes.

### FR-02 Mess and membership

-   Create mess with name, address/description, currency and timezone.
-   Invite by expiring, revocable invite link/code.
-   Membership status: invited, active, inactive, left.
-   Profile fields: member name, phone, room/seat, joining date, leaving
    date.
-   Preserve historical records after a member leaves.
-   Roles: manager and member in MVP. Support multiple managers.
-   Manager transfer requires confirmation and audit event.

### FR-03 Manager schedule

-   Assign manager for a date range or a repeating rotation.
-   Rotation interval supports 1--7 days and custom positive day count.
-   Support monthly rotation by calendar month.
-   Provide preview of upcoming manager assignments.
-   A scheduled rotation does not automatically grant elevated
    permissions unless the assignment becomes effective and the policy
    explicitly enables it.
-   Manual override must record who changed it and why.

### FR-04 Meal management

-   Meal slots: breakfast, lunch, dinner; mess can rename or disable
    slots.
-   Daily member meal count per slot; support 0, 0.5 (optional
    configuration), 1 or configurable quantity.
-   Guest meals must be attributed to the hosting member or a guest
    label and included in the chosen settlement policy.
-   Member may request meal-off for a future date/slot before cutoff.
-   Manager can approve/reject requests; show request status and
    timestamps.
-   Manager can directly correct a meal entry with a reason.
-   Calculate total meals and meal rate for the selected period.

### FR-05 Bazaar and expenses

-   Record date, payer/member, amount, title/items, category and
    optional note.
-   Categories include rice, lentils, fish/meat, vegetables, oil/spices,
    gas, cleaning, transport, other.
-   Attach receipt image or PDF with file-size/type restrictions.
-   Bazaar roster supports date, assigned member and completion status.
-   Shopping list supports item, quantity, requested by, status and
    optional estimated cost.

### FR-06 Shared bills

-   Record rent, electricity, gas, internet, water, cleaner/cook/maid
    and other shared charges.
-   Allocation methods: equal per active member, room/seat weight,
    custom member amounts, or usage-based values.
-   Recurring monthly templates create draft bills; manager reviews and
    confirms each month.
-   Proration for members joining/leaving mid-month must be configurable
    and visible.

### FR-07 Deposits and payments

-   Record member, amount, date, method (cash, bKash, Nagad, bank,
    other), reference and note.
-   Distinguish deposit/advance from reimbursement to a member who paid
    an expense.
-   Track received, refunded and reversed payments; never silently erase
    a payment.
-   Display total paid, outstanding due and advance.

### FR-08 Monthly ledger and settlement

-   Produce member statement with meal count, meal charge, shared bills,
    adjustments, expense credits/reimbursements, payments and final
    balance.
-   Positive/negative balance wording must be unambiguous: "Member owes
    mess" or "Mess owes member".
-   Provide drill-down to source transactions.
-   Manager can preview, reconcile and close a month.
-   Export PDF and CSV/XLSX; shareable report must respect member
    privacy.

### FR-09 Dashboard

-   Current month bazaar total, shared bill total, meal count and meal
    rate.
-   Per-member meal and payment summary.
-   Outstanding dues and advances.
-   Daily expense and meal trend charts.
-   Dashboard data must respect the viewer's role and mess membership.

### FR-10 Notifications and notices

-   In-app notices for bazaar roster, payment due, meal-off cutoff and
    manager announcements.
-   Notification preferences per member.
-   Email/push/SMS delivery are optional integrations; do not promise
    delivery until provider setup is complete.

### FR-11 Additional tools

-   Notice board, utensils/assets inventory, complaint/suggestion box
    and audit log.
-   Dark mode and Bangla/English language selection.
-   Data export and backup/restore process.
-   Month lock and controlled reopen.

## 7. Key user journeys

1.  Manager creates a mess, sets currency/timezone and invites members.
2.  Member joins, confirms profile and sees the current month.
3.  Manager/member records meals; meal-off requests are reviewed.
4.  Bazaar buyer enters purchase and uploads receipt.
5.  Manager enters recurring rent and utility bills and confirms
    allocation.
6.  Members submit deposits; manager records receipt.
7.  Month-end preview shows each member's complete calculation.
8.  Manager resolves discrepancies, closes month and exports statements.

## 8. MVP acceptance criteria

-   A manager can create a mess and invite at least five members.
-   Members cannot read or modify another member's private records
    unless the record is intentionally mess-wide.
-   Meal rate and member settlement match independently calculated test
    fixtures.
-   A closed month rejects ordinary writes.
-   Every financial edit creates an audit event.
-   A member can see an understandable statement and export is readable.
-   Mobile layout works at 360px viewport width without horizontal
    scrolling on primary screens.

## 9. Success metrics

-   Percentage of active messes that complete one monthly close.
-   Number of active members per mess.
-   Meal-entry completion rate by day.
-   Percentage of expenses with payer and category recorded.
-   Number of unresolved balance disputes/support reports.
-   Monthly active messes and 30-day retention.

## 10. Risks and mitigations

-   **Different mess accounting conventions:** expose settings and
    document defaults.
-   **Incorrect data entry:** validation, edit history, confirmation and
    reconciliation.
-   **Manager disputes:** multiple managers, explicit transfer flow and
    audit log.
-   **Privacy leaks:** strict tenant scoping and role-based
    authorization.
-   **Poor connectivity:** fast forms, optimistic UI only for
    non-financial actions, retry-safe writes.
