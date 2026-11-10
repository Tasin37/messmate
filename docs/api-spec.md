# API Contract Outline

The application may use Route Handlers or Server Actions. Regardless of
transport, preserve these service contracts and authorization rules.

## 1. Conventions

-   Base path: `/api/v1` if REST handlers are used.
-   JSON request/response.
-   Auth via secure session cookie.
-   Tenant context resolved from membership; `messId` in route is a
    selector, not proof of access.
-   Validate all inputs with Zod.
-   Use ISO-8601 dates/timestamps.
-   Use decimal money strings in JSON (e.g. `"1250.00"`) to avoid
    precision loss.
-   Paginate collection endpoints.
-   Return stable error codes.

## 2. Endpoint outline

  ------------------------------------------------------------------------------------------------
  Method                  Endpoint                                         Purpose
  ----------------------- ------------------------------------------------ -----------------------
  POST                    `/messes`                                        Create mess

  GET                     `/messes`                                        List current user's
                                                                           messes

  GET                     `/messes/:messId`                                Mess details

  POST                    `/messes/:messId/invites`                        Create invite

  POST                    `/invites/:token/accept`                         Accept invite

  GET/POST                `/messes/:messId/members`                        List/add members

  PATCH                   `/messes/:messId/members/:memberId`              Update membership

  GET/POST                `/messes/:messId/meals`                          List/create meal
                                                                           entries

  POST                    `/messes/:messId/meal-off-requests`              Request meal off

  POST                    `/messes/:messId/meal-off-requests/:id/review`   Approve/reject

  GET/POST                `/messes/:messId/expenses`                       List/create expense

  GET/POST                `/messes/:messId/bills`                          List/create shared bill

  GET/POST                `/messes/:messId/payments`                       List/record payment

  GET                     `/messes/:messId/settlements/:periodId`          Get statements

  POST                    `/messes/:messId/periods/:periodId/close`        Close month

  POST                    `/messes/:messId/periods/:periodId/reopen`       Reopen month

  GET                     `/messes/:messId/reports/:periodId`              Export report

  GET                     `/messes/:messId/audit-logs`                     Manager audit view
  ------------------------------------------------------------------------------------------------

## 3. Example expense payload

``` json
{
  "expenseDate": "2026-11-10",
  "paidByMemberId": "uuid",
  "categoryId": "uuid",
  "title": "Weekly bazaar",
  "amount": "1850.00",
  "note": "Rice, vegetables and fish",
  "pool": "meal"
}
```

The server must verify that the payer, category and period belong to the
same mess and that the period is open.

## 4. Example error response

``` json
{
  "error": {
    "code": "PERIOD_CLOSED",
    "message": "This accounting period is closed."
  }
}
```

## 5. Idempotency

For payment and other retry-prone financial creation routes, accept an
idempotency key and enforce uniqueness per mess/actor/operation.
Repeated requests with the same key must return the original result or a
safe conflict, not create duplicate money records.

## 6. Authorization matrix

  -----------------------------------------------------------------------
  Operation                             Manager                    Member
  ------------------- ------------------------- -------------------------
  View shared mess                          Yes                       Yes
  dashboard                                     

  View own statement                        Yes                       Yes

  View all member                           Yes     No (unless explicitly
  balances                                              shared by policy)

  Add/edit own meal                Configurable              Configurable

  Edit another                              Yes                        No
  member's meal                                 

  Approve meal-off                          Yes                        No
  request                                       

  Add bazaar expense                        Yes                  Optional

  Confirm shared bill                       Yes                        No

  Record own deposit                        Yes                  Optional
  request                                       

  Confirm/reverse                           Yes                        No
  payment                                       

  Close/reopen month                        Yes                        No

  Manage                                    Yes                        No
  roles/invites                                 
  -----------------------------------------------------------------------
