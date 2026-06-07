# NeoBank Super-App — Chronological API Reference & System Flows

This document details the chronological user journey through the NeoBank Super-App API endpoints, followed by visual architectural flowcharts to showcase exactly how the application functions behind the scenes.

---

## 🗺️ System Architecture Flowchart

This Mermaid flowchart visualizes how a customer interacts with NeoBank, how security is enforced, how the core ledger is updated, and how wallet payments route through the dynamic strategy pattern.

```mermaid
graph TD
    %% User and Entry Point
    User([👤 Customer]) -->|HTTP Requests| API_Gateway[🌐 API Controller Gateway]
    
    %% Security & Auth Filter
    API_Gateway -->|1. Authenticate Request| SecurityFilter{🔐 Spring Security Filter}
    SecurityFilter -->|Invalid/Missing Token| AccessDenied[❌ 401 Unauthorized]
    SecurityFilter -->|Valid JWT| RouteRequest{🎯 Route Request}
    
    %% Routing to Core Modules
    RouteRequest -->|Auth Endpoint| AuthModule[🔐 Auth Module]
    RouteRequest -->|Account Endpoint| BankingModule[🏦 Core Banking Module]
    RouteRequest -->|Transaction Endpoint| TransactionModule[💳 Ledger Module]
    RouteRequest -->|Wallet / Payment Endpoint| WalletModule[💸 PayFlow Wallet Module]

    %% Ledger Subsystem
    subgraph Core Ledger Subsystem
        TransactionModule -->|Atomically Mutate| AccountBalances[(🏦 Account Balances Table)]
        TransactionModule -->|Write Audit Trail| TransactionRecord[(📝 Transactions Ledger)]
        TransactionModule -->|Double-Entry Debit/Credit| SubLedger[(📊 Ledger Entries Table)]
    end

    %% Dynamic Strategy Subsystem
    subgraph Wallet Dynamic Strategy Subsystem
        WalletModule -->|Validate Balance| PayFlowWallet[(💸 Wallet Balance Table)]
        WalletModule -->|Dynamic Strategy Resolution| StrategyFactory{⚙️ Strategy Factory}
        
        StrategyFactory -->|Type = BOOKING| AirlineMovieStrategy[✈️/🎬 Booking Wallet Strategy]
        StrategyFactory -->|Type = BILL| BillPayStrategy[🔌 Bill Payment Strategy]
        StrategyFactory -->|Type = RECHARGE| RechargeStrategy[📱 Mobile Recharge Strategy]
        
        AirlineMovieStrategy -->|Confirm & Debit| PayFlowWallet
        BillPayStrategy -->|Confirm & Debit| PayFlowWallet
        RechargeStrategy -->|Confirm & Debit| PayFlowWallet
    end
```

---

## 🔄 User Action Flow (Step-by-Step Journeys)

This flowchart illustrates the typical user path from absolute signup to opening accounts, depositing funds, transferring, and using the dynamic strategy wallet system.

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Auth as 🔐 Auth Module
    participant Banking as 🏦 Banking Module
    participant Ledger as 💳 Ledger Module
    participant Wallet as 💸 PayFlow Module

    Customer->>Auth: POST /api/v1/auth/signup (Register details)
    Auth-->>Customer: User Registered (CUSTOMER/ADMIN)
    
    Customer->>Auth: POST /api/v1/auth/login (Submit email & password)
    Auth-->>Customer: Success (Returns JJWT Access & Refresh Tokens)

    Note over Customer, Auth: Customer attaches Bearer token to all subsequent requests

    Customer->>Banking: POST /api/v1/accounts (Open SAVINGS/CHECKING account)
    Banking-->>Customer: Returns Account DTO (e.g. Account Number: 1234567890)

    Customer->>Ledger: POST /api/v1/transactions/deposit (Deposit ₹10,000)
    Note right of Ledger: DB Lock: Optimistic Version Check
    Ledger->>Ledger: Insert CREDIT entry to Ledger Entries Table
    Ledger-->>Customer: Returns TransactionResponse (Reference: TXN-ABCD1234)

    Customer->>Ledger: POST /api/v1/transactions/transfer (Send ₹2,000 to Recipient)
    Note right of Ledger: Atomic Transaction: Sender Debit + Recipient Credit
    Ledger->>Ledger: Write DEBIT on Sender + Write CREDIT on Recipient
    Ledger-->>Customer: Transfer Successful DTO

    Customer->>Wallet: POST /api/v1/payflow/wallet/initialize (Link checking account + deposit ₹1,500)
    Note right of Wallet: Withdraw ₹1,500 from core checking account
    Wallet->>Wallet: Initialize wallet with ₹1,500 balance (must be >= 1k)
    Wallet-->>Customer: Wallet Activated DTO

    Customer->>Wallet: POST /api/v1/payflow/wallet/recharge (amount = ₹2,000)
    Note right of Wallet: Withdraw ₹2,000 from connected checking account
    Wallet->>Wallet: Credit wallet balance (+₹2,000)
    Wallet-->>Customer: Wallet Recharged DTO

    Customer->>Wallet: POST /api/v1/payflow/send (Send ₹500 P2P to Recipient)
    Note right of Wallet: Balance check: Sender balance stays >= 1k
    Wallet->>Wallet: Debit Sender Wallet ₹500 & Credit Recipient Wallet ₹500
    Wallet-->>Customer: Transfer completed successfully
```

---

## 📖 Chronological API Reference

Here is the list of REST APIs in the exact order a client/frontend application calls them to run the super-app:

### 🔐 1. Authentication Layer (Public Endpoints)

#### A. Sign Up / Register
* **Endpoint**: `POST /api/v1/auth/signup`
* **Purpose**: Register a new user in the system.
* **Payload**:
  ```json
  {
    "email": "customer@neobank.com",
    "username": "customer_neobank",
    "password": "Password123!",
    "fullName": "Jane Doe"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully."
  }
  ```

#### B. Log In / Authenticate
* **Endpoint**: `POST /api/v1/auth/login`
* **Purpose**: Authenticate credentials and receive authorization tokens.
* **Payload**:
  ```json
  {
    "email": "customer@neobank.com",
    "password": "Password123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Authentication successful.",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d7bca81d...",
      "username": "customer_neobank",
      "email": "customer@neobank.com",
      "role": "CUSTOMER"
    }
  }
  ```

---

### 🏦 2. Account Management Layer (Authenticated: JWT Required)

#### A. Open a New Account
* **Endpoint**: `POST /api/v1/accounts`
* **Purpose**: Create a CHECKING or SAVINGS account with ₹0.00 default balance.
* **Payload**:
  ```json
  {
    "type": "CHECKING"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account opened successfully.",
    "data": {
      "id": "acc-uuid-1234",
      "accountNumber": "9816273849",
      "ownerName": "Jane Doe",
      "type": "CHECKING",
      "balance": 0.00,
      "formattedBalance": "₹0.00",
      "status": "ACTIVE",
      "currency": "INR",
      "createdAt": "2026-05-26T23:30:00"
    }
  }
  ```

#### B. List My Accounts
* **Endpoint**: `GET /api/v1/accounts`
* **Purpose**: Fetch all accounts opened by the logged-in customer.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Accounts retrieved.",
    "data": [
      {
        "id": "acc-uuid-1234",
        "accountNumber": "9816273849",
        "ownerName": "Jane Doe",
        "type": "CHECKING",
        "balance": 0.00,
        "formattedBalance": "₹0.00",
        "status": "ACTIVE",
        "createdAt": "2026-05-26T23:30:00"
      }
    ]
  }
  ```

---

### 💳 3. Core Transactions & Ledger Layer (Authenticated)

#### A. Deposit Funds
* **Endpoint**: `POST /api/v1/transactions/deposit`
* **Purpose**: Credit cash into an account (e.g. simulation of cash deposit/UPI load).
* **Headers**: `X-Idempotency-Key` or payload-based `idempotencyKey`.
* **Payload**:
  ```json
  {
    "accountId": "acc-uuid-1234",
    "amount": 10000.00,
    "description": "Initial account deposit",
    "idempotencyKey": "dep-idem-key-001"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Deposit processed successfully.",
    "data": {
      "id": "txn-uuid-8888",
      "fromAccountNumber": "External",
      "fromOwnerName": "N/A",
      "toAccountNumber": "9816273849",
      "toOwnerName": "Jane Doe",
      "amount": 10000.00,
      "formattedAmount": "₹10,000.00",
      "type": "DEPOSIT",
      "status": "SUCCESS",
      "reference": "TXN-E7C1F2B3A499",
      "description": "Initial account deposit",
      "createdAt": "2026-05-26T23:35:10"
    }
  }
  ```

#### B. Withdraw Funds
* **Endpoint**: `POST /api/v1/transactions/withdraw`
* **Purpose**: Debit cash from an account. Enforces balance check & user ownership.
* **Payload**:
  ```json
  {
    "accountId": "acc-uuid-1234",
    "amount": 1500.00,
    "description": "ATM cash withdrawal",
    "idempotencyKey": "with-idem-key-001"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Withdrawal processed successfully.",
    "data": {
      "id": "txn-uuid-8890",
      "fromAccountNumber": "9816273849",
      "fromOwnerName": "Jane Doe",
      "toAccountNumber": "External",
      "toOwnerName": "N/A",
      "amount": 1500.00,
      "formattedAmount": "₹1,500.00",
      "type": "WITHDRAW",
      "status": "SUCCESS",
      "reference": "TXN-F9D1E8C2B3A1",
      "description": "ATM cash withdrawal",
      "createdAt": "2026-05-26T23:37:45"
    }
  }
  ```

#### C. Peer-to-Peer Transfer
* **Endpoint**: `POST /api/v1/transactions/transfer`
* **Purpose**: Perform an atomic double-entry transfer of money to a recipient's account number.
* **Payload**:
  ```json
  {
    "fromAccountId": "acc-uuid-1234",
    "toAccountNumber": "0987654321",
    "amount": 2500.00,
    "description": "Rent payment",
    "idempotencyKey": "trans-idem-key-001"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transfer completed successfully.",
    "data": {
      "id": "txn-uuid-8895",
      "fromAccountNumber": "9816273849",
      "fromOwnerName": "Jane Doe",
      "toAccountNumber": "0987654321",
      "toOwnerName": "Recipient Name",
      "amount": 2500.00,
      "formattedAmount": "₹2,500.00",
      "type": "TRANSFER",
      "status": "SUCCESS",
      "reference": "TXN-A5C9B1E3F7D2",
      "description": "Rent payment",
      "createdAt": "2026-05-26T23:40:02"
    }
  }
  ```

#### D. Fetch Transaction History (Paging)
* **Endpoint**: `GET /api/v1/transactions?page=0&size=10`
* **Purpose**: Fetch all debit/credit transactions for the user, newest first.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transaction history retrieved successfully.",
    "data": {
      "content": [
        {
          "id": "txn-uuid-8895",
          "fromAccountNumber": "9816273849",
          "fromOwnerName": "Jane Doe",
          "toAccountNumber": "0987654321",
          "toOwnerName": "Recipient Name",
          "amount": 2500.00,
          "formattedAmount": "₹2,500.00",
          "type": "TRANSFER",
          "status": "SUCCESS",
          "reference": "TXN-A5C9B1E3F7D2",
          "description": "Rent payment",
          "createdAt": "2026-05-26T23:40:02"
        }
      ],
      "pageable": { ... },
      "totalElements": 1,
      "totalPages": 1
    }
  }
  ```

---

### 💸 4. PayFlow Core Wallet Layer (Authenticated: JWT Required)

#### A. Get Wallet Details
* **Endpoint**: `GET /api/v1/payflow/wallet`
* **Purpose**: Fetch details of the authenticated user's wallet. Returns 404 Not Found if the wallet is not yet initialized/activated.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Wallet details retrieved successfully.",
    "data": {
      "id": "wal-uuid-1234",
      "username": "jane_doe",
      "ownerName": "Jane Doe",
      "balance": 1500.00,
      "formattedBalance": "₹1,500.00",
      "currency": "INR",
      "active": true,
      "updatedAt": "2026-05-28T16:00:00"
    }
  }
  ```

#### B. Initialize / Activate Wallet
* **Endpoint**: `POST /api/v1/payflow/wallet/initialize`
* **Purpose**: Link a bank account permanently and deposit an initial amount (must be $\ge$ ₹1,000.00).
* **Query Parameters**:
  - `accountId`: The UUID of the bank account to connect.
  - `initialAmount`: The deposit amount (e.g. `1500.00`).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Wallet initialized and activated successfully.",
    "data": {
      "id": "wal-uuid-1234",
      "username": "jane_doe",
      "ownerName": "Jane Doe",
      "balance": 1500.00,
      "formattedBalance": "₹1,500.00",
      "currency": "INR",
      "active": true,
      "updatedAt": "2026-05-28T16:05:00"
    }
  }
  ```

#### C. Recharge Wallet Balance
* **Endpoint**: `POST /api/v1/payflow/wallet/recharge`
* **Purpose**: Pull funds into the wallet directly from the permanently connected banking account.
* **Query Parameters**:
  - `amount`: The recharge amount (e.g. `2000.00`).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Wallet recharged successfully.",
    "data": {
      "id": "wal-uuid-1234",
      "username": "jane_doe",
      "ownerName": "Jane Doe",
      "balance": 3500.00,
      "formattedBalance": "₹3,500.00",
      "currency": "INR",
      "active": true,
      "updatedAt": "2026-05-28T16:10:00"
    }
  }
  ```

#### D. Send P2P Money Instantly
* **Endpoint**: `POST /api/v1/payflow/send`
* **Purpose**: Instantly transfer money from the sender's wallet to the recipient's wallet, ensuring the sender's balance remains $\ge$ ₹1,000.00.
* **Payload**:
  ```json
  {
    "toUsername": "bobby_32",
    "amount": 400.00,
    "note": "Lunch share"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Money sent successfully.",
    "data": {
      "id": "req-uuid-9999",
      "fromUsername": "jane_doe",
      "fromFullName": "Jane Doe",
      "toUsername": "bobby_32",
      "toFullName": "Bobby Smith",
      "amount": 400.00,
      "formattedAmount": "₹400.00",
      "status": "ACCEPTED",
      "note": "Lunch share",
      "createdAt": "2026-05-28T16:15:00"
    }
  }
  ```

#### E. Request P2P Money
* **Endpoint**: `POST /api/v1/payflow/request`
* **Purpose**: Create a pending request for money from another registered user.
* **Payload**:
  ```json
  {
    "fromUsername": "alice_w",
    "amount": 500.00,
    "note": "Movie ticket split"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Money requested successfully.",
    "data": {
      "id": "req-uuid-8888",
      "fromUsername": "jane_doe",
      "fromFullName": "Jane Doe",
      "toUsername": "alice_w",
      "toFullName": "Alice Wonder",
      "amount": 500.00,
      "formattedAmount": "₹500.00",
      "status": "PENDING",
      "note": "Movie ticket split",
      "createdAt": "2026-05-28T16:20:00"
    }
  }
  ```

#### F. Approve / Accept Payment Request
* **Endpoint**: `POST /api/v1/payflow/requests/{id}/accept`
* **Purpose**: Accepts an incoming pending payment request, debiting the payer's wallet (must stay $\ge$ ₹1,000.00) and crediting the requestor.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payment request accepted successfully.",
    "data": {
      "id": "req-uuid-8888",
      "fromUsername": "jane_doe",
      "fromFullName": "Jane Doe",
      "toUsername": "alice_w",
      "toFullName": "Alice Wonder",
      "amount": 500.00,
      "formattedAmount": "₹500.00",
      "status": "ACCEPTED",
      "note": "Movie ticket split",
      "createdAt": "2026-05-28T16:20:00"
    }
  }
  ```

#### G. Decline Payment Request
* **Endpoint**: `POST /api/v1/payflow/requests/{id}/decline`
* **Purpose**: Rejects and cancels an incoming pending payment request.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payment request declined successfully.",
    "data": {
      "id": "req-uuid-8888",
      "fromUsername": "jane_doe",
      "fromFullName": "Jane Doe",
      "toUsername": "alice_w",
      "toFullName": "Alice Wonder",
      "amount": 500.00,
      "formattedAmount": "₹500.00",
      "status": "DECLINED",
      "note": "Movie ticket split",
      "createdAt": "2026-05-28T16:20:00"
    }
  }
  ```

#### H. Get P2P Activity Feed
* **Endpoint**: `GET /api/v1/payflow/requests`
* **Purpose**: List sent/received P2P requests (pending, accepted, declined).

#### I. Get QR Payment Payload
* **Endpoint**: `GET /api/v1/payflow/qrcode`
* **Purpose**: Returns a custom URI payload for wallet payments.

#### J. Unified Wallet Payment (Strategy Framework)
* **Endpoint**: `POST /api/v1/payflow/pay`
* **Purpose**: Pay for bookings, bills, or mobile recharges via the wallet strategy framework.
* **Payload**:
  ```json
  {
    "type": "BOOKING",
    "amount": 850.00,
    "metadata": {
      "provider": "AIRLINE",
      "bookingRef": "PNR123456"
    }
  }
  ```
* **Types & metadata**:
  - `BOOKING` → `provider`, `bookingRef`
  - `BILL` → `billerCode`, `consumerId`
  - `RECHARGE` → `operator`, `mobileNumber`

#### K. Wallet Payment History
* **Endpoint**: `GET /api/v1/payflow/payments`
* **Purpose**: List confirmed booking, bill, and recharge payments for the authenticated user.

---

### 👤 5. User Profile Layer (Authenticated)

#### A. Get My Profile
* **Endpoint**: `GET /api/v1/users/me`
* **Purpose**: Returns the current user's profile (email, username, full name, phone, role, status).

---

### 📊 6. ClearLedger Module (Authenticated)

#### A. Log Expense
* **Endpoint**: `POST /api/v1/clearledger/expenses`
* **Payload**:
  ```json
  {
    "amount": 450.00,
    "category": "FOOD",
    "description": "Team lunch",
    "expenseDate": "2026-06-03"
  }
  ```
* **Categories**: `FOOD`, `TRAVEL`, `UTILITIES`, `SHOPPING`, `ENTERTAINMENT`, `OTHER`

#### B. List Expenses
* **Endpoint**: `GET /api/v1/clearledger/expenses`
* **Query params (optional)**: `category`, `fromDate`, `toDate`

#### C. Create / Update Budget
* **Endpoint**: `POST /api/v1/clearledger/budgets`
* **Payload**:
  ```json
  {
    "category": "FOOD",
    "limitAmount": 5000.00,
    "period": "MONTHLY"
  }
  ```

#### D. List Budgets
* **Endpoint**: `GET /api/v1/clearledger/budgets`
* **Purpose**: Returns budgets with spent and remaining amounts for the current period.

#### E. Spending Analytics
* **Endpoint**: `GET /api/v1/clearledger/analytics`
* **Query params (optional)**: `fromDate`, `toDate`
* **Purpose**: Total spend and breakdown by category.

---

## Base URL & Swagger

- **Local base URL:** `http://localhost:8081`
- **Swagger UI:** `http://localhost:8081/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8081/api-docs`

