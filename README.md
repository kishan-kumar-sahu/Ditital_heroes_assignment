# Digital Heroes — MERN + MVC

This version keeps the existing Digital Heroes business logic and API behavior while restructuring the application into a standard MERN stack with MVC on the Express backend.

## Stack
- **MongoDB** — persistent database
- **Express.js** — REST API
- **React + Vite** — responsive SPA
- **Node.js** — server runtime
- **Mongoose** — MongoDB models
- **JWT** — authentication

## MVC structure
```text
Digital_Heroes/
│
├── api/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── charityController.js
│   │   ├── dashboardController.js
│   │   ├── drawController.js
│   │   ├── paymentController.js
│   │   ├── scoreController.js
│   │   ├── subscriptionController.js
│   │   └── winnerController.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── models/
│   │   └── index.js
│   │
│   ├── routes/
│   │   └── api.js
│   │
│   ├── utils/
│   │   ├── draw.js
│   │   ├── security.js
│   │   └── seed.js
│   │
│   ├── .env
│   ├── package.json
│   └── src.js
│
├── client/
│   ├── public/
│   │   └── assets/
│   │       ├── charity-default.svg
│   │       ├── charity-1.svg
│   │       ├── charity-2.svg
│   │       └── ...
│   │
│   ├── src/
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── .env
│   ├── index.html
│   └── package.json
│
├── docs/
│   └── requirement-matrix.md
│
├── screenshots/
│   ├── architecture.png
│   ├── admin-dashboard.png
│   ├── user-dashboard.png
│   ├── login.png
│   ├── user-preview.html
│   └── admin-preview.html
│
├── .env.example
├── .gitignore
├── CHANGES.md
├── package.json
└── README.md
```

```text
Razorpay environment variables

Configure the API environment with:

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_CURRENCY=INR

Do not commit real Razorpay credentials to GitHub.
```


## Business logic preserved
- Stableford score range 1–45.
- One score per user/date.
- Latest 5 scores retained; adding a sixth removes the oldest.
- Monthly $20 and yearly $200 demo subscription plans.
- Charity contribution minimum 10%, configurable up to 100%.
- Prize pool = 50% of active subscription amounts.
- 5-match = 40%, 4-match = 35%, 3-match = 25%.
- Equal prize split among winners in a tier.
- Same ticket conversion and draw-number algorithm as the original implementation.
- Admin simulation before publishing.
- Winner proof → verification → payout workflow.
- Admin charity CRUD.

## Run locally
### 1. Start MongoDB
With Docker:
```bash
docker compose up -d
```
Or use MongoDB Atlas and set `MONGO_URI` in `api/.env`.

### 2. Install dependencies
```bash
npm install
npm run install-all
```

### 3. Environment files
Copy:
```text
api/.env.example -> api/.env
client/.env.example -> client/.env
```

Default local values work with Docker MongoDB.

### 4. Start development
```bash
npm run dev
```
Frontend: http://localhost:5173
API: http://localhost:5000

## Demo credentials
User:
```text
Email: demo@digitalheroes.co.in
Password: Demo@12345
```

Admin:
```text
Email: admin@digitalheroes.co.in
Password: Admin@12345
```

## Production
- Configure Razorpay test/live credentials and use the real checkout flow documented above.
- Use MongoDB Atlas for production persistence.
- Set a strong JWT secret.
- Configure Vercel/Node deployment environment variables.


## Payment integration

Subscription activation now uses a real Razorpay Checkout flow instead of the old demo endpoint:

1. Create Razorpay test/live API keys.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_CURRENCY` to `api/.env`.
3. Start the API and client.
4. Select a plan, charity and contribution percentage, then click **Pay & activate subscription**.
5. The backend creates the Razorpay order, verifies the returned signature, records the payment, and only then activates the subscription.

For international currencies such as USD, the Razorpay account must have the corresponding international-payment capability enabled. Razorpay documents international multi-currency support and hosted checkout separately from its domestic setup.

## Score-entry fix

The score modal now submits directly to the score API, shows backend validation errors inside the modal, prevents duplicate submissions while saving, and refreshes the dashboard after a successful save. The API continues to enforce an active subscription, score range `1–45`, one score per date, and the latest-five-score retention rule.
