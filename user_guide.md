# NeoBank Super-App — User Guide

Welcome to **NeoBank**, a modular banking super-app with core accounts, transactions, PayFlow wallet, and ClearLedger expense tracking. This guide walks you through everyday use of the web app.

---

## Getting started

### Run the app

1. **Backend** (Spring Boot, port `8081`):
   ```bash
   cd backend
   mvn spring-boot:run
   ```
2. **Frontend** (Vite, port `5173`):
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### Simulation vs Live mode

| Mode | Purpose |
|------|---------|
| **Simulation** | Local demo with pre-seeded data — no backend required |
| **Live** | Connects to Spring Boot API on `http://localhost:8081` |

Toggle mode from the top bar before signing in. Live mode requires the backend to be running.

### Demo credentials (Simulation)

- **Email:** `jane@neobank.com`
- **Password:** `Password123!`

---

## Navigation

The sidebar maps directly to backend modules:

| Tab | Module | What you can do |
|-----|--------|-----------------|
| **Accounts** | Core Banking | View net worth, manage Checking/Savings, open accounts |
| **Transactions** | Ledger | Deposit, withdraw, transfer between accounts |
| **Ledger** | Audit | View double-entry credit/debit history |
| **Wallet** | PayFlow | P2P send/request, service payments, recharge |
| **ClearLedger** | Expenses | Log expenses, set budgets, view analytics |
| **Profile** | User | View your account details |

Use the **sun/moon** icon to switch **light** or **dark** theme. Your preference is saved automatically.

---

## Accounts

1. Sign in and open **Accounts**.
2. Your **net worth** and linked accounts appear at the top.
3. Click **Add** on any account to load simulated or live balance (simulation / test helper).
4. Open a second account (Checking or Savings) if you have fewer than two — the app enforces a **maximum of 2 accounts** per user.

---

## Transactions

1. Go to **Transactions**.
2. Choose **From account** and action type:
   - **Deposit** — add cash to an account
   - **Withdraw** — remove cash from an account
   - **Transfer** — send to another account number
3. Enter amount and optional description.
4. Each transaction uses an **idempotency key** to prevent duplicate charges on retry.
5. Recent activity appears below the form.

---

## Ledger

The **Ledger** tab shows the audit trail: every credit and debit with balance-after values and transaction references. Use this to verify that double-entry accounting is balanced.

---

## Wallet (PayFlow)

### Activate wallet

1. Open **Wallet** before a wallet exists.
2. Select a **funding account** (Checking or Savings).
3. Enter an **initial load of at least ₹1,000**.
4. The linked account is **permanent** — it cannot be changed later.

### Recharge

Pull more funds from your linked bank account into the wallet via **Recharge**.

### Pay with wallet (Bookings, Bills, Recharges)

Use the **Strategy framework** panel to pay for services:

| Type | Required fields | Example |
|------|-----------------|---------|
| **BOOKING** | Provider, Booking ref | AIRLINE, PNR123 |
| **BILL** | Biller code, Consumer ID | ELEC-DL, ACC998877 |
| **RECHARGE** | Operator, Mobile number | JIO, 9876543210 |

Your wallet balance must stay **≥ ₹1,000** after any payment.

### P2P send & request

- **Send money** — instant transfer to another user's `@username`.
- **Request money** — ask someone to pay you; they can **Accept** or **Decline** from their Requests list.

---

## ClearLedger

### Log an expense

1. Open **ClearLedger**.
2. Enter amount, **category** (Food, Travel, Utilities, etc.), and optional description.
3. Click **Add expense**.

### Set a budget

1. Choose category, **limit amount**, and period (**Monthly** or **Weekly**).
2. Click **Save budget**.
3. Progress bars show spent vs limit for each category.

### Analytics

The dashboard shows **total spent this month** and a breakdown **by category** when data exists.

---

## Profile

View your name, username, email, phone, and role. In **Live mode**, profile data is loaded from `GET /api/v1/users/me`.

---

## API & developer docs

| Document | Location |
|----------|----------|
| API reference (Markdown) | `api_reference.md` |
| API specification (HTML) | `neobank_api_documentation.html` |
| Architecture guide (HTML) | `neobank_architecture_guide.html` |
| Swagger UI (Live backend) | `http://localhost:8081/swagger-ui.html` |

---

## Tips & limits

- **Currency:** INR (₹) throughout the app.
- **Wallet floor:** Balance cannot drop below ₹1,000 after sends, request approvals, or service payments.
- **Account limit:** One Checking and one Savings maximum.
- **Sign out** clears your session; switch to Live mode only when the backend is reachable.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Live login fails | Ensure backend runs on port 8081 |
| Wallet payment rejected | Check balance stays ≥ ₹1,000 |
| Empty ledger | Run a deposit or transfer first |
| Theme not saving | Allow localStorage in your browser |

For technical architecture details, see `neobank_architecture_guide.html`.
