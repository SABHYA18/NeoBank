# NeoBank Super-App — Technical Architecture & Operational Guide

Welcome to the comprehensive technical architecture guide for the **NeoBank Super-App**. This document explains how the entire application works, divided into the **Backend (Spring Boot Monolith)** and **Frontend (React SPA)** modules, detailing the core design choices, workflow paths, and programmatic constraints.

---

## 🏦 Part 1: The Backend (Spring Boot Monolith)

The backend is built as a **Modular Monolith** in Java 21 and Spring Boot 3.x. While it runs as a single deployed server, it maintains strict separation between core business layers:

```
                  [ COM.NEOBANK ]
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
  🔐 [AUTH]          🏦 [BANKING]       💸 [PAYFLOW]
  Identity & JWT     Accounts & Ledger  Wallet & P2P
```

---

### 1. Security & Authentication Layer (`com.neobank.auth`)
* **Stateless JJWT Authentication**: Identity validation is completely stateless. When a user logs in, the server signs a JSON Web Token (JWT) with a robust secret key and sends it to the client. The client attaches this token inside the `Authorization: Bearer <token>` header for all protected API actions.
* **Spring Security Filters**: A custom `JwtAuthFilter` intercepts every incoming HTTP request, decodes the JWT, validates its expiration and signatures, and loads the user's `UserPrincipal` into Spring's security context holder, making the validated `User` entity immediately accessible to REST controllers.

---

### 2. Core Banking & Ledger Subsystem (`com.neobank.banking`)
* **Double-Entry Ledger Accounting**: Financial security and auditability are guaranteed by double-entry ledger rules. Every deposit, withdrawal, or transfer is backed by atomic credit and debit entries in the `ledger_entries` table. This guarantees that balances are never calculated on-the-fly via unverified sums, but rather computed strictly as running aggregates of audited entries.
* **Idempotency Safeguard Filters**: To prevent double-charging due to network retries, every transaction requires a unique client-generated `idempotencyKey`. The server checks the `transactions` table for the key before executing the request. If the key exists, the previous transaction response is retransmitted instantly without running the balance debit logic again.
* **JPA Optimistic Concurrency Locking**: The `Account` table has a `@Version` locking field. If two threads attempt to modify an account balance concurrently, Hibernate detects the mismatch and throws an `ObjectOptimisticLockingFailureException`. The monolith intercepts this and rolls back the database transaction, preventing race conditions.
* **Strict Two-Account Limit Constraints**: To align with strict banking policy guidelines, each user is restricted to a maximum of 2 active bank accounts in total (one `CHECKING` and one `SAVINGS`). The backend service proactively validates this cap during new account creation and blocks duplicate types, throwing clear rejections when limits are exceeded.

---

### 3. PayFlow Core Wallet & P2P Subsystem (`com.neobank.payflow`)
* **Immutable Single Wallet Relationship**: 
  - Each customer profile is allowed exactly **one** digital wallet.
  - During wallet initialization (`POST /api/v1/payflow/wallet/initialize`), the user selects one of their bank accounts (checking or savings) to connect. **This linked account preference is permanent and cannot be modified or remapped later**.
* **The ₹1,000 (1k) Floor Safety Limit**:
  - **Initial Activation Load**: Setting up a wallet requires an initial deposit of **at least ₹1,000** pulled directly from the connected banking account.
  - **Balance Floor Rule**: The wallet balance is prevented from falling below **₹1,000**. Any P2P send or request approval that would push the wallet balance under ₹1,000 is rejected with a `400 Bad Request`.
* **Isolated Balances & Pull Recharges**:
  - The wallet and bank account only make contact when a **recharge** is made (`POST /api/v1/payflow/wallet/recharge`), which withdraws funds from the selected account and credits the wallet balance.
  - All peer-to-peer (P2P) transfers (sends and requests) occur purely inside the `payflow_wallets` table, completely decoupled from core bank accounts.

---

## 🎨 Part 2: The Frontend (React + TS + Tailwind v4)

The frontend is a modern single-page application built on **Vite 5**, **React 18**, **TypeScript**, and styled with **Tailwind CSS v4**'s advanced theme directives.

---

### 1. Aesthetic Design System (`index.css`)
* **Apple-Inspired Typography & Spacing**: Employs the elegant `Outfit` typeface with thin font-weights, wide letter spacing, spacious layouts, and micro-thin visual dividers (`border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60`).
* **Micro-Animations & Transitions**:
  - Elements lift gracefully (`hover:-translate-y-0.5`) and expand subtle colored glowing shadow animations (`hover:shadow-glow-cyan` or `hover:shadow-glow-violet`) on hover.
  - System toasts slide in from the left and sit securely in the **top-left corner** (`fixed top-6 left-6 z-[99999]`) using high-contrast solid backgrounds (`bg-zinc-900 border-zinc-800`) to guarantee clear readability above all background elements.
* **Cyber-Neon Glassmorphic Portal**: A breathtaking dark-themed login and registration interface using high-contrast neon borders, vibrant cyan/violet highlights, and smooth micro-animations. Form elements employ clean glass backdrop-blurs with vivid focus states.

---

### 2. Unified Workspace Portals (`App.tsx`)
The application is structured into four main operational views navigated in the sticky header:

#### A. Overview Tab (Dashboard)
Displays the aggregate net worth in large, thin typography alongside responsive, hover-reactive rows showing the individual savings and checking account details. Provides a quick form to open new accounts.
* **Dynamic Limit Controls**: If a user already possesses both Savings and Checking accounts, the account-opening form is automatically hidden and replaced with an elegant, informative "Maximum Limit Reached" alert. If only one account exists, the selection dropdown automatically filters out the type already held, making only the valid remaining option available.

#### B. Transactions Tab
A secure operations form allowing cash deposits, ATM withdrawals, and internal checking/savings transfers. Displays a live monospace printout of the active **Idempotency tracking key** generated for the transaction.

#### C. Ledger Tab
A clean audit table compiling double-entry ledger logs, illustrating chronological credits/debits, balances after execution, and corresponding transaction IDs.

#### D. Wallet Tab (PayFlow Ecosystem)
* **Virtual Neo-Card Component**: An interactive credit card illustrating the live wallet balance, holder name, and linked account number. Features deep glowing animations and flips on cursor interaction.
* **Account Linking Form**: Active only when no wallet exists. Prompts savings/checking linkage, enforces the ₹1,000 minimum deposit rule, and launches the initialization sequence.
* **Transfer & Request Forms**: Dynamic panels allowing instant sends or incoming payment requests.
* **Requests & Activity Feed**: A list showing pending and accepted requests. Incoming requests display inline **Accept** and **Decline** actions, immediately debiting/crediting balances and triggering toast notifications on click.

---

### 3. Automated Security Token Handshake
* **The "Live Mode" Switch**: Toggling the connectivity control in the top header transitions the app from the local mock simulator to the active Spring Boot backend on **port 8081**.
* **Manual Sign In / Sign Up Flows**: Beyond automated handshakes, a fully interactive authentication portal allows users to register custom accounts (providing their name, email, username, and password) and choose their initial banking account type (Savings or Checking) right from the signup sheet. Upon signup, the application registers the user, logs them in, and automatically invokes initial account creation to ensure they enter the dashboard fully configured and pre-funded.
* **Header Profile & Sign Out Interface**: Displays the authenticated username (e.g. `@jane_doe`) directly in the header and hosts a prominent, stylish "Sign Out" control. Clicking this securely cleans up tokens, transaction caches, ledger views, and wallet bindings in both live and simulated modes.
