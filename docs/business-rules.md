# Business Rules and Accounting Policy

This document is the canonical reference for calculations. Any change
requires tests and a policy-version update.

## 1. Recommended MVP accounting model

Use two separate pools:

1.  **Meal pool:** eligible food/bazaar expenses divided by total
    billable meal units.
2.  **Shared-cost pool:** rent, utilities, internet, water and service
    costs allocated by the selected bill policy.

Do not automatically include every expense category in the meal-rate
numerator. Gas may be configured as meal-pool or shared-cost; rent
should normally be shared-cost.

## 2. Meal rate

`Meal rate = eligible meal-pool expenses / total billable meal units`

-   Include only approved expenses assigned to the meal pool and
    belonging to the accounting period.
-   Exclude voided expenses and expenses outside the period.
-   If total meal units are zero, meal rate is undefined; display "Not
    available" and require manager review rather than dividing by zero.
-   Define rounding policy: calculate at high precision, round each
    member's final charge to currency precision, and reconcile any
    residual deterministically.

## 3. Member meal charge

`member meal charge = member billable meal units × meal rate`

Guest meals must be counted once. Recommended default: attribute guest
meal units to the host member, but display them separately in the
statement.

## 4. Shared bills

Supported methods: - Equal: bill amount / eligible member count. -
Weighted: bill amount × member weight / total weights. - Custom: manager
enters each member amount; allocations must sum to bill total. -
Room-based: allocate by room/seat weight or configured room share.

For join/leave proration, define whether the denominator uses calendar
days, active days, or a manual allocation. Recommended default: active
days in the period for rent; equal split among eligible members for
utilities unless the mess changes it.

## 5. Member payments and expense credits

A member who pays a bazaar expense on behalf of the mess receives an
**expense credit** equal to the approved amount (or approved
reimbursable portion). A deposit is a payment **from the member to the
mess**. These must not be mixed.

## 6. Final balance sign convention

Recommended formula:

`final_balance = meal_charge + shared_bill_charge + other_charges - expense_credit - payments_total`

-   `final_balance > 0`: member owes the mess.
-   `final_balance < 0`: the mess owes the member
    (advance/reimbursement).
-   `final_balance = 0`: settled.

The UI must show words, not only a signed number.

## 7. Manager rotation

-   Fixed-day rotation: each turn lasts N calendar days, where N is 1--7
    or a configured custom positive integer.
-   Monthly rotation: each calendar month is a turn.
-   Define rotation start date and ordered member list.
-   Skip inactive members only if the schedule setting says so;
    otherwise require manager intervention.
-   Schedule assignment and permission role remain separate unless
    explicit temporary-role behavior is enabled.

## 8. Meal-off cutoff

Each mess configures a cutoff time and timezone. Requests after cutoff
may be blocked or require manager approval. A request applies only to
future meal slots. Approval must be auditable.

## 9. Period close

A period cannot close while required review items remain unresolved.
After close, reject meal, expense, bill and payment edits for that
period. Reopen requires manager permission, reason and audit event;
recalculation creates a new snapshot version.

## 10. Rounding and reconciliation

Use decimal arithmetic. Store source amounts to 2 decimal places for
BDT. Calculate ratios with adequate precision. Assign rounding residuals
using a documented deterministic rule (e.g. largest fractional
remainder, then stable member ID order) so allocation sums exactly to
the source bill.
