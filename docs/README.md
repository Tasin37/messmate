# Mess Manager --- Project Documentation

A mobile-first, multi-tenant bachelor-mess management platform for
tracking members, meals, bazaar purchases, shared bills, deposits,
monthly settlements, and operational notices.

## Documentation index

  ----------------------------------------------------------------------------------------
  File                                                 Purpose
  ---------------------------------------------------- -----------------------------------
  [prd.md](prd.md)                                     Product goals, users, scope,
                                                       functional requirements, success
                                                       metrics

  [trd.md](trd.md)                                     Technology choices, application
                                                       modules, interfaces and
                                                       implementation constraints

  [architecture.md](architecture.md)                   System architecture, data flow,
                                                       tenancy and deployment topology

  [database.md](database.md)                           PostgreSQL entities, relationships,
                                                       constraints and migration guidance

  [business-rules.md](business-rules.md)               Canonical accounting, meal,
                                                       manager-rotation and month-closing
                                                       rules

  [ux-spec.md](ux-spec.md)                             Navigation, screens, interaction
                                                       patterns and responsive behavior

  [security.md](security.md)                           Authentication, authorization,
                                                       tenant isolation, privacy and
                                                       threat controls

  [testing.md](testing.md)                             Test strategy, scenarios, fixtures
                                                       and release gates

  [roadmap.md](roadmap.md)                             Phased delivery plan and definition
                                                       of done

  [environment.md](environment.md)                     Local setup, environment variables
                                                       and deployment configuration

  [api-spec.md](api-spec.md)                           API conventions and endpoint
                                                       contract outline

  [competitive-analysis.md](competitive-analysis.md)   Product positioning, alternatives
                                                       and differentiation hypotheses

  [deployment.md](deployment.md)                       Vercel, PostgreSQL, migrations,
                                                       backups and operations

  [contributing.md](contributing.md)                   Branching, coding standards and
                                                       pull-request workflow

  [glossary.md](glossary.md)                           Shared domain terminology
  ----------------------------------------------------------------------------------------

## Product principles

1.  **Correct money before clever UI.** Store monetary values as integer
    minor units or PostgreSQL `NUMERIC`; never use floating-point
    arithmetic for balances.
2.  **Every record belongs to a mess.** Tenant scoping is mandatory in
    every query and authorization check.
3.  **Explain every balance.** A member must be able to inspect meals,
    charges, bills, deposits and adjustments behind their settlement.
4.  **Keep an audit trail.** Financial records should be corrected
    through traceable edits or reversals, not silent deletion.
5.  **Mobile first, Bangla ready.** The common member workflow must be
    comfortable on a phone, with Bangla and English labels.
6.  **Close months deliberately.** A closed month is immutable to
    ordinary users; reopening requires explicit manager action and audit
    history.

## MVP recommendation

Build in this order: authentication and mess membership → meal entries →
bazaar expenses → shared bills → deposits → monthly ledger and
settlement → month close/export. Notifications, inventory, complaints,
advanced charts and automation can follow after the accounting core is
reliable.

## Important product assumptions

-   Initial target market: small bachelor messes in Bangladesh.
-   Default timezone: `Asia/Dhaka`, but persist timestamps in UTC and
    render in the mess timezone.
-   Currency: BDT (৳) for the first release; model currency per mess so
    expansion does not require a schema redesign.
-   A user may belong to multiple messes; a mess has one or more
    managers.
-   "Manager rotation" is an assignment/scheduling feature, not an
    automatic transfer of financial ownership.
-   The exact accounting policy for guest meals, room-wise rent, absent
    members and manager rotation must be configurable or explicitly
    confirmed before production use.

## Versioning

Treat this documentation as the baseline product specification. Update
the relevant document in the same pull request whenever a business rule,
API contract, schema, or user-visible workflow changes.
