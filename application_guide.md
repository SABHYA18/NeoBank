# NeoBank Super-App — Technical Architecture & Operational Guide

Welcome to the comprehensive technical architecture guide for the **NeoBank Super-App**. This document explains how the application works across backend modules and the React frontend.

---

## Part 1: The Backend (Spring Boot Monolith)

The backend is a **modular monolith** in Java 21 and Spring Boot 3.x with strict module boundaries:

```
                  [ COM.NEOBANK ]
                         │
    ┌────────────┬───────┼───────┬────────────┐
    ▼            ▼       ▼       ▼            ▼
 🔐 AUTH     👤 USER  🏦 BANK  💸 PAYFLOW  📊 CLEARLEDGER
 JWT/Login   Profile  Accounts  Wallet/P2P  Expenses/Budgets
```

**Database:** PostgreSQL (Supabase) in production profile; schema managed via JPA `ddl-auto=update`.

---

### 1. Security & Authentication (`com.neobank.auth`)

- **Stateless JWT:** Login returns access + refresh tokens; clients send `Authorization: Bearer <token>`.
- **JwtAuthFilter:** Validates tokens and loads `UserPrincipal` into Spring Security context.
- **Endpoints:** `POST /api/v1/auth/signup`, `/login`, `/refresh`.

---

### 2. User Module (`com.neobank.user`)

- **Profile API:** `GET /api/v1/users/me` returns email, username, full name, phone, role, and status.
- Extensible for KYC and settings in future phases.

---

### 3. Core Banking & Ledger (`com.neobank.banking`)

- **Double-entry ledger:** Every deposit, withdrawal, and transfer creates audited debit/credit entries in `ledger_entries`.
- **Idempotency:** Transactions require a unique `idempotencyKey` to prevent duplicate processing.
- **Optimistic locking:** `@Version` on accounts prevents concurrent balance race conditions.
- **Two-account limit:** Each user may hold one Checking and one Savings account maximum.

---

### 4. PayFlow Wallet & P2P (`com.neobank.payflow`)

- **Single wallet per user**, permanently linked to one bank account at initialization.
- **₹1,000 floor:** Initial load ≥ ₹1,000; balance cannot fall below ₹1,000 after sends or payments.
- **P2P:** Send, request, accept, decline via wallet balances (isolated from core accounts except recharge).
- **QR payload:** `GET /api/v1/payflow/qrcode` for payment URI generation.

#### Wallet Strategy Framework

Service payments route through a pluggable strategy pattern:

| Component | Role |
|-----------|------|
| `WalletStrategy` | Interface: `validate()` + `execute()` |
| `WalletStrategyFactory` | Resolves strategy by `PaymentType` |
| `BookingWalletStrategy` | Flights, movies, transport bookings |
| `BillPaymentWalletStrategy` | Utility and bill payments |
| `RechargeWalletStrategy` | Mobile operator recharges |

- **Unified endpoint:** `POST /api/v1/payflow/pay` with `type` + `metadata`.
- **History:** `GET /api/v1/payflow/payments` reads from `payflow_payments` table.

---

### 5. ClearLedger (`com.neobank.clearledger`)

Expense tracking and budgeting module:

| Entity | Table | Purpose |
|--------|-------|---------|
| `Expense` | `expenses` | Logged spends by category and date |
| `Budget` | `budgets` | Category limits (weekly/monthly) |

**Endpoints:**
- `POST/GET /api/v1/clearledger/expenses`
- `POST/GET /api/v1/clearledger/budgets`
- `GET /api/v1/clearledger/analytics`

---

## Part 2: The Frontend (React + Vite + TypeScript)

Built with **Vite 5**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

### Design system (`index.css`)

- **Outfit** typography with gradient mesh background.
- **Glass sidebar** with module-colored navigation accents.
- **Light/dark theme** toggle with `localStorage` persistence (`data-theme` attribute).
- **Glow effects** on active nav, panels, wallet card, and toasts.
- **Accessible:** skip link, focus rings, ARIA labels, semantic tables.

### Layout (`layout.tsx`, `AuthenticatedUI.tsx`)

| Tab | Backend module | UI features |
|-----|----------------|-------------|
| Accounts | banking/account | Net worth metrics, account rows, open account |
| Transactions | banking/transaction | Deposit/withdraw/transfer form, activity feed |
| Ledger | ledger_entries | Audit table |
| Wallet | payflow | Wallet card, P2P, strategy payments, recharge |
| ClearLedger | clearledger | Expenses, budgets, analytics chips |
| Profile | user | Profile details from `/users/me` |

### Modes

- **Simulation:** Local state with demo user `jane@neobank.com`.
- **Live:** REST calls to `http://localhost:8081` with JWT bearer token.

---

## Part 3: API Documentation

| Resource | Location |
|----------|----------|
| User guide | `user_guide.md` |
| API reference | `api_reference.md` |
| HTML API spec | `neobank_api_documentation.html` |
| Swagger UI | `http://localhost:8081/swagger-ui.html` |

---

## Implementation status (June 2026)

| Phase | Status |
|-------|--------|
| Phase 1 — Auth & accounts | ✅ Complete |
| Phase 2 — Transactions & ledger | ✅ Complete |
| Phase 3 — PayFlow + strategy framework | ✅ Complete |
| Phase 4 — ClearLedger | ✅ Complete |
| Phase 5 — Frontend | ✅ Complete (sidebar UI, all modules) |
| Phase 6 — Cloud & polish | 🔄 Supabase connected; rate limiting pending |
