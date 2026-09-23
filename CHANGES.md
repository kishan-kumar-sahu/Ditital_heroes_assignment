# Changes

## Duplicate score date fix

The score flow now validates duplicate dates directly against the database.

### Backend
- Added `GET /api/scores/check-date?date=YYYY-MM-DD`.
- The endpoint checks the authenticated user's exact date in MongoDB.
- Existing `POST /api/scores` and `PUT /api/scores/:id` duplicate protection remains authoritative.
- The MongoDB unique index on `{ userId, date }` remains as the final concurrency safeguard.

### Frontend
- Removed reliance on the native date input's same-value `onChange`/focus behavior.
- Every Save operation calls the dedicated server-side date check first.
- Selecting a date that already exists also checks the server immediately.
- Duplicate dates now show a visible in-app popup:
  `A score already exists for this date. Please choose another date.`
- The popup is a React UI modal rather than `window.alert`, so it is visible inside the application.
- Edit mode ignores the score currently being edited, but rejects another score using the same date.

## Why this fixes the issue
The earlier implementation depended on client-side score state and browser date-input events. A native `<input type="date">` does not fire `onChange` when the user re-selects the exact same value, and dashboard data is limited to the latest five scores. The new flow asks the database directly on Save, so neither limitation can prevent duplicate-date detection.
