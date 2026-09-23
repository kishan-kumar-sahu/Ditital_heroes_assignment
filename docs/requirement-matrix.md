# PRD requirement matrix

| PRD | Implementation |
|---|---|
| Subscription monthly/yearly | Dashboard subscription card + `/api/subscription/demo` |
| Real-time access control | JWT middleware + subscription check on subscriber routes |
| Latest five scores | POST score inserts then trims oldest; date uniqueness enforced |
| Stableford 1–45 | API validation |
| Monthly draws | Draw management UI + simulation/publish APIs |
| Random/weighted draw | `drawEngine.js` |
| Prize shares | 5-match 40%, 4-match 35%, 3-match 25% |
| Jackpot rollover | Unclaimed 5-match pool is carried into next draw |
| Charity min 10% | Contribution calculation and API validation |
| Charity directory | Public directory + admin CRUD |
| Winner verification | Proof URL + review + payout state |
| User dashboard | Subscription, scores, charity, draws, winnings |
| Admin dashboard | Metrics, users, charities, draw, winners, analytics |
| Responsive UX | CSS media queries |
| Mandatory deliverables | Source, schema, credentials guidance, local runnable app |

## Deliberate deployment dependencies

- Actual Stripe payments need Stripe credentials and webhook configuration.
- A new Supabase project and Vercel account must be created by the evaluator.
- Image/media storage can be connected to Supabase Storage; local demo accepts proof URLs so the workflow is testable without credentials.
