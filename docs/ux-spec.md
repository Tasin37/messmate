# UX Specification

## 1. UX principles

-   Mobile-first: optimize for 360--430px screens.
-   Show the current mess and accounting month persistently.
-   Use plain Bangla labels with optional English translation.
-   Financial values always include currency and clear status words.
-   Make common actions reachable in one or two taps.
-   Confirm destructive or financially significant actions.
-   Show loading, empty, error, offline/retry and success states.

## 2. Navigation

### Mobile bottom navigation

1.  Home
2.  Meals
3.  Hisab (Finance)
4.  Bazaar
5.  More

### Desktop sidebar

Dashboard, Meals, Bazaar & Expenses, Bills, Payments, Monthly Hisab,
Members, Schedule, Notices, Reports, Settings.

The active mess selector is visible at the top. A user with multiple
messes can switch without mixing data.

## 3. Screen specifications

### Dashboard

-   Month selector and mess name.
-   Summary cards: total bazaar, total meals, meal rate, shared bills,
    outstanding due.
-   Member status list: owes / advance / settled.
-   Daily expense and meal trend.
-   Quick actions: add meal, add bazaar, record payment.

### Meals

-   Date picker defaulting to today.
-   Breakfast/lunch/dinner tabs.
-   Member list with quantity stepper or compact selector.
-   Guest meal entry with host selection.
-   "Meal off" request and request status.
-   Manager correction requires reason.
-   Show daily total and period total.

### Bazaar / Expenses

-   Amount, date, buyer, category, item summary and note.
-   Receipt upload with preview and upload progress.
-   Bazaar roster and shopping list.
-   Clearly distinguish "paid by member" from "member deposit".

### Bills

-   Monthly templates.
-   Bill amount, category, allocation method and allocation preview.
-   Per-member allocation preview before confirmation.
-   Warning if allocations do not sum to bill total.

### Payments

-   Member, amount, date, method, optional reference.
-   Receipt/reference attachment optional.
-   Payment history and reversal state.
-   Due/advance indicator.

### Monthly Hisab

-   Member statement selector.
-   Breakdown: meals, meal rate, meal charge, shared bills, other
    charges, expense credits, deposits and final balance.
-   Explain balance in plain language.
-   Manager preview/reconcile/close controls.
-   PDF/CSV export.

### Members

-   Active and inactive tabs.
-   Profile, room, join/leave date, role.
-   Invite link creation and revocation.
-   Manager transfer and rotation schedule.

### Settings

-   Mess name, currency, timezone, meal slots, cutoff time.
-   Meal pool categories and bill allocation defaults.
-   Language, theme and notification preferences.
-   Month close/reopen controls.

## 4. Visual system

-   Use a restrained neutral background and clear typography.
-   Use semantic colors consistently: success/settled, warning/due,
    danger/error, informational.
-   Do not communicate balance using color alone; pair with text and
    icons.
-   Use accessible contrast and visible keyboard focus.
-   Use tabular numerals for monetary amounts.
-   Avoid dense desktop-style tables on phones; use stacked statement
    sections.

## 5. Bangla localization

-   Default language can be selected during onboarding.
-   Store stable translation keys, not translated strings, in database.
-   Format dates and numbers with locale-aware formatters.
-   Keep database values language-neutral.
-   Support Bengali font fallback and test line wrapping.
-   Suggested labels: Meal = মিল, Bazaar = বাজার, Shared bill = অন্যান্য
    বিল, Deposit = জমা, Due = বাকি, Advance = অগ্রিম.

## 6. Accessibility

Target WCAG 2.2 AA where practical: - Keyboard navigation and focus
states. - Labels for all form fields. - Error text associated with
inputs. - Minimum touch target around 44px. - Screen-reader names for
icon-only buttons. - Charts must have text summaries or data tables.
