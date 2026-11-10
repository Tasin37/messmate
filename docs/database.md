# Database Design

## 1. Conventions

-   Primary keys: UUID.
-   Timestamps: `timestamptz`, stored in UTC.
-   Calendar dates: PostgreSQL `date`.
-   Money: `numeric(14,2)` in the mess currency; do not use `real` or
    `double precision`.
-   Quantities: `numeric(8,2)` where half-meals or weighted allocations
    are supported.
-   Tenant-owned records include `mess_id`.
-   Use `created_at`, `updated_at`, and `created_by` where appropriate.
-   Use check constraints and foreign keys; do not rely only on frontend
    validation.

## 2. Core tables

### Identity (Better Auth-managed)

Use Better Auth's documented schema for user, session, account and
verification tables. Keep its schema aligned with the installed version.
Product tables reference the auth user ID using the compatible type.

### `messes`

`id`, `name`, `slug`, `currency_code`, `timezone`, `address`,
`created_by`, `status`, `created_at`, `updated_at`.

### `mess_members`

`id`, `mess_id`, `user_id`, `display_name`, `phone`, `room_label`,
`role`, `status`, `joined_on`, `left_on`, `created_at`, `updated_at`.
Unique active membership per `(mess_id, user_id)`. Preserve historical
membership.

### `mess_invites`

`id`, `mess_id`, `token_hash`, `role_to_assign`, `expires_at`,
`max_uses`, `used_count`, `revoked_at`, `created_by`.

### `manager_schedules`

`id`, `mess_id`, `member_id`, `starts_on`, `ends_on`, `rotation_type`
(`fixed_days` / `monthly`), `rotation_days`, `sequence_order`,
`is_override`, `note`, `created_by`. Do not let overlapping assignments
silently create ambiguity.

### `accounting_periods`

`id`, `mess_id`, `year`, `month`, `status`, `closed_at`, `closed_by`,
`reopened_at`, `reopened_by`, `policy_version`, `snapshot_hash`. Unique
`(mess_id, year, month)`.

### `meal_slots`

`id`, `mess_id`, `code`, `label`, `sort_order`, `is_active`.

### `meal_entries`

`id`, `mess_id`, `member_id`, `meal_date`, `meal_slot_id`, `quantity`,
`entry_type` (`self`, `guest`, `manager_adjustment`), `host_member_id`,
`note`, `created_by`, `updated_by`, timestamps. Add unique constraint
appropriate to one member/date/slot/source policy. If multiple guest
entries are needed, store them as separate rows.

### `meal_off_requests`

`id`, `mess_id`, `member_id`, `meal_date`, `meal_slot_id`, `status`,
`requested_at`, `reviewed_by`, `reviewed_at`, `reason`. A request is not
an actual meal entry; approval updates/creates the relevant meal
quantity through a controlled service.

### `expense_categories`

`id`, `mess_id`, `name`, `code`, `is_active`, `sort_order`.

### `expenses`

`id`, `mess_id`, `expense_date`, `paid_by_member_id`, `category_id`,
`title`, `amount`, `note`, `status`, `created_by`, `updated_by`,
timestamps. Use statuses such as `draft`, `approved`, `voided`. Voids
require reason and audit event.

### `expense_items` (optional)

`id`, `mess_id`, `expense_id`, `item_name`, `quantity`, `unit`,
`unit_price`, `line_total`.

### `file_attachments`

`id`, `mess_id`, `owner_type`, `owner_id`, `storage_key`,
`original_name`, `mime_type`, `size_bytes`, `uploaded_by`, `created_at`.

### `shared_bill_templates`

`id`, `mess_id`, `name`, `category`, `default_amount`,
`allocation_method`, `is_active`, `created_by`.

### `shared_bills`

`id`, `mess_id`, `period_id`, `template_id`, `title`, `category`,
`amount`, `allocation_method`, `status`, `created_by`. A template
creates a draft bill for a period; it must not silently post duplicate
bills.

### `bill_allocations`

`id`, `mess_id`, `shared_bill_id`, `member_id`, `amount`, `weight`,
`calculation_note`. Unique `(shared_bill_id, member_id)`.

### `member_payments`

`id`, `mess_id`, `member_id`, `period_id`, `amount`, `payment_date`,
`method`, `reference`, `status`, `recorded_by`, `note`. Use reversal
records or status transitions with audit; avoid hard deletes.

### `member_adjustments`

`id`, `mess_id`, `member_id`, `period_id`, `direction`, `amount`,
`reason`, `created_by`, `approved_by`, `status`. Direction must be
explicitly defined (credit to member vs charge to member).

### `monthly_settlements`

`id`, `mess_id`, `period_id`, `calculated_at`, `policy_version`,
`calculated_by`, `is_final`, `total_meal_count`, `total_expense_amount`,
`total_shared_bill_amount`.

### `settlement_lines`

`id`, `mess_id`, `settlement_id`, `member_id`, `meal_count`,
`meal_charge`, `shared_bill_charge`, `other_charges`, `expense_credit`,
`payments_total`, `final_balance`, `breakdown_json`. Store snapshot
amounts and enough detail to reproduce the calculation.

### `audit_logs`

`id`, `mess_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`,
`before_data`, `after_data`, `reason`, `request_id`, `created_at`.
Restrict update/delete permissions for the application role.

### Supporting tables

`notices`, `shopping_list_items`, `bazaar_roster`, `inventory_items`,
`complaints`, `notification_preferences`, `notifications`,
`mess_settings`.

## 3. Relationships

-   One user can have many mess memberships.
-   One mess has many members, periods, meal entries, expenses and
    bills.
-   A period has many bills, payments, settlement snapshots and
    settlement lines.
-   A member can have many meal entries, payments and allocations.
-   An expense can have one or more receipt attachments.
-   Every tenant-owned foreign key should prevent cross-mess references.

## 4. Indexes

At minimum: - `mess_members(mess_id, status)` -
`meal_entries(mess_id, meal_date, member_id)` -
`expenses(mess_id, expense_date, status)` -
`shared_bills(mess_id, period_id, status)` -
`member_payments(mess_id, period_id, member_id)` -
`audit_logs(mess_id, created_at DESC)` -
`accounting_periods(mess_id, year, month)`

Add indexes based on `EXPLAIN ANALYZE` and real query patterns.

## 5. Migration rules

-   Number migrations sequentially, e.g. `001_create_core.sql`.
-   Migrations must be deterministic and safe to run once.
-   Use a `schema_migrations` table to track applied versions.
-   Never edit a migration already applied to shared/production
    environments; create a new migration.
-   Test migrations against an empty database and a copy of
    representative data.
-   Seed only development/test data; never seed default production
    passwords.

## 6. Data integrity

-   Foreign keys should include tenant identity where possible.
-   Use check constraints for positive amounts, valid month and quantity
    ranges.
-   Use transactions for payment, expense, approval and month-close
    operations.
-   Avoid cascade deletes for financial history.
-   Reconcile settlement totals against source records.
