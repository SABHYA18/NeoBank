import json

# ========================================================
# 1. UPGRADED ARCHITECTURE POSTMAN COLLECTION GENERATOR
# ========================================================
postman_collection = {
    "info": {
        "_postman_id": "neobank-superapp-architecture-spec-v3",
        "name": "NeoBank Super-App Architecture & Operational Reference",
        "description": "API Reference mappings detailing the full Backend Spring Boot Monolith interfaces and the React SPA token handshake rules.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "🔐 1. Security & Authentication Layer",
            "item": [
                {
                    "name": "Sign Up / Register User",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "email": "customer@neobank.com",
                                "username": "jane_doe",
                                "password": "Password123!",
                                "fullName": "Jane Doe"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/auth/signup",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "auth", "signup"]
                        },
                        "description": "Registers the default credentials automatically during the Frontend 'Live Mode' zero-configuration handshake switch."
                    }
                },
                {
                    "name": "Log In / Token Handshake",
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "var jsonData = pm.response.json();",
                                    "if (jsonData.success && jsonData.data && jsonData.data.accessToken) {",
                                    "    pm.environment.set(\"accessToken\", jsonData.data.accessToken);",
                                    "    pm.environment.set(\"refreshToken\", jsonData.data.refreshToken);",
                                    "}"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"username": "jane_doe", "password": "Password123!"}, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/auth/login",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "auth", "login"]
                        },
                        "description": "Authenticates credentials and returns the stateless JJWT token. Binds the extracted Authorization header globally across the SPA runtime state."
                    }
                }
            ]
        },
        {
            "name": "🏦 2. Core Banking & Double-Entry Ledger Subsystem",
            "item": [
                {
                    "name": "Open Financial Instrument",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"type": "CHECKING"}, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/accounts",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "accounts"]
                        },
                        "description": "Creates a CHECKING/SAVINGS record. Balances are calculated dynamically using database aggregates of running audit columns."
                    }
                },
                {
                    "name": "Deposit Funds (Idempotent Top-Up)",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "X-Idempotency-Key", "value": "dep-idem-key-999"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "accountId": "acc-uuid-1234",
                                "amount": 10000.00,
                                "description": "Initial account deposit",
                                "idempotencyKey": "dep-idem-key-999"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/transactions/deposit",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "transactions", "deposit"]
                        },
                        "description": "Simulates a load sequence. Intercepted by the backend Idempotency Filter to guarantee safety during execution drop retries."
                    }
                },
                {
                    "name": "Atomic Account-to-Account Transfer",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "X-Idempotency-Key", "value": "trans-idem-key-999"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "fromAccountId": "acc-uuid-1234",
                                "toAccountNumber": "0987654321",
                                "amount": 2000.00,
                                "description": "Internal P2P Balance Shift",
                                "idempotencyKey": "trans-idem-key-999"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/transactions/transfer",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "transactions", "transfer"]
                        },
                        "description": "Performs double-entry isolation changes. Implements Hibernate @Version annotations to throw failure events if matching balances shift concurrently."
                    }
                }
            ]
        },
        {
            "name": "💸 3. PayFlow Core Wallet Subsystem",
            "item": [
                {
                    "name": "Fetch Wallet Details",
                    "request": {
                        "method": "GET",
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/payflow/wallet",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "payflow", "wallet"]
                        },
                        "description": "Returns wallet status configurations. Throws a 404 block if an active single ledger binding profile doesn't exist."
                    }
                },
                {
                    "name": "Initialize Core Wallet (1k Floor Constraint)",
                    "request": {
                        "method": "POST",
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/payflow/wallet/initialize?accountId=acc-uuid-1234&initialAmount=1500.00",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "payflow", "wallet", "initialize"],
                            "query": [
                                {"key": "accountId", "value": "acc-uuid-1234"},
                                {"key": "initialAmount", "value": "1500.00"}
                            ]
                        },
                        "description": "Permanently links a single checking account to the profile. Enforces an absolute minimum load constraint of >= 1,000 INR."
                    }
                },
                {
                    "name": "Wallet Pull Balance Recharge",
                    "request": {
                        "method": "POST",
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/payflow/wallet/recharge?amount=2000.00",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "payflow", "wallet", "recharge"],
                            "query": [
                                {"key": "amount", "value": "2000.00"}
                            ]
                        },
                        "description": "Withdraws currency items straight from the locked checking account link to increase wallet assets."
                    }
                },
                {
                    "name": "Send Instantly (Enforces 1k Minimum Limit)",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "toUsername": "bobby_32",
                                "amount": 500.00,
                                "note": "Dinner Split"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/payflow/send",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "payflow", "send"]
                        },
                        "description": "Shifts assets inside isolated payflow partitions. Rejects request with a 400 bad payload block if the remaining sender balance falls below 1,000 INR."
                    }
                }
            ]
        }
    ],
    "auth": {
        "type": "bearer",
        "bearer": [{"key": "token", "value": "{{accessToken}}", "type": "string"}]
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:8081", "type": "string"},
        {"key": "accessToken", "value": "handshake_jwt_placeholder", "type": "string"},
        {"key": "refreshToken", "value": "handshake_refresh_placeholder", "type": "string"}
    ]
}

with open("neobank_postman_collection.json", "w", encoding="utf-8") as f:
    json.dump(postman_collection, f, indent=4)


# ========================================================
# 2. COMPREHENSIVE ARCHITECTURE & OPERATIONAL MANUAL (HTML)
# ========================================================
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>NeoBank Super-App — Technical Architecture & Operational Guide</title>
    <style>
        :root {
            --bg-main: #fafbfc;
            --text-primary: #1a252f;
            --text-secondary: #4a5568;
            --accent-blue: #3498db;
            --border-color: rgba(226, 232, 240, 0.8);
            --code-bg: #1e272e;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.625;
            color: var(--text-primary);
            max-width: 1040px;
            margin: 40px auto;
            padding: 0 24px;
            background: var(--bg-main);
            -webkit-font-smoothing: antialiased;
        }
        h1 {
            font-size: 30px;
            font-weight: 800;
            color: #111827;
            border-bottom: 3px solid var(--accent-blue);
            padding-bottom: 14px;
            letter-spacing: -0.5px;
            margin-bottom: 30px;
        }
        h2 {
            font-size: 21px;
            font-weight: 700;
            color: #1f2937;
            margin-top: 45px;
            border-left: 5px solid var(--accent-blue);
            padding-left: 14px;
            margin-bottom: 20px;
        }
        h3 {
            font-size: 15px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4b5563;
            margin-top: 24px;
            margin-bottom: 8px;
        }
        p {
            color: var(--text-secondary);
            margin: 10px 0 16px 0;
            font-size: 15px;
        }
        ul {
            padding-left: 20px;
            margin: 10px 0;
        }
        li {
            color: var(--text-secondary);
            font-size: 14.5px;
            margin-bottom: 8px;
        }
        strong {
            color: #111827;
        }
        .module-block {
            background: #ffffff;
            border: 1px solid var(--border-color);
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
        }
        .badge {
            background: #eef2f6;
            color: #475569;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: 600;
            font-family: monospace;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
        }
        .highlight-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
            padding: 14px 18px;
            border-radius: 6px;
            font-size: 14px;
            margin: 15px 0;
        }
        .highlight-box.error-rule {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
        }
        pre {
            background: var(--code-bg);
            color: #f5f6fa;
            padding: 16px;
            border-radius: 6px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 13.5px;
            overflow-x: auto;
            margin: 14px 0;
        }
        .ascii-art {
            background: #f8fafc;
            color: #334155;
            border: 1px solid #e2e8f0;
            font-weight: bold;
        }
        @media print {
            body { background: #fff; margin: 0; max-width: 100%; }
            .module-block { page-break-inside: avoid; border: 1px solid #cbd5e1; }
        }
    </style>
</head>
<body>

    <h1>NeoBank Super-App — Technical Architecture & Operational Guide</h1>
    <p>This technical architectural whitepaper outlines the systematic design decisions, internal framework operations, and constraints mapping out the NeoBank Super-App platform ecosystem.</p>

    <h2>🏦 Part 1: The Backend (Spring Boot Monolith)</h2>
    <p>The core layer is packaged as a high-performance <strong>Modular Monolith</strong> running on <strong>Java 21</strong> and <strong>Spring Boot 3.x</strong> architecture, enforcing rigid isolation interfaces between discrete business boundaries.</p>

    <div class="module-block">
        <h3>Architecture Context Map</h3>
        <pre class="ascii-art">                  [ COM.NEOBANK ]
                        │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
  🔐 [AUTH]          🏦 [BANKING]       💸 [PAYFLOW]
  Identity & JWT    Accounts & Ledger   Wallet & P2P</pre>
    </div>

    <div class="module-block">
        <h3>1. Security & Authentication Layer <span class="badge">com.neobank.auth</span></h3>
        <p><strong>Stateless JJWT Authentication:</strong> Identity confirmation utilizes completely stateless processing structures. Upon successful validation of credentials, the server engine yields a JSON Web Token (JWT) stamped using SHA cryptographic key rules. The customer interface attaches this record inside the <code>Authorization: Bearer &lt;token&gt;</code> call headers for subsequent validation sweeps.</p>
        <p><strong>Spring Security Filters:</strong> A custom filter element named <code>JwtAuthFilter</code> screens each inbound packet, decrypts token payloads, ensures validation windows remain open, and populates the <code>UserPrincipal</code> model context inside Spring's active <code>SecurityContextHolder</code> matrix.</p>
    </div>

    <div class="module-block">
        <h3>2. Core Banking & Ledger Subsystem <span class="badge">com.neobank.banking</span></h3>
        <p><strong>Double-Entry Ledger Accounting:</strong> System auditing guarantees immutable accounting entries. Financial adjustments are computed dynamically by pulling aggregations directly out of the <code>ledger_entries</code> ledger history tables. Individual balances are never modified as raw, mutable column fields.</p>
        <p><strong>Idempotency Safeguard Filters:</strong> Prevent duplication vulnerabilities triggered by connection retries by enforcing strict verification parameters based on incoming client-supplied <code>idempotencyKey</code> strings. Duplicate requests match previous logs in the database and return cached tracking blocks instantly.</p>
        <p><strong>JPA Optimistic Concurrency Locking:</strong> The account structural entity model uses an internal <code>@Version</code> concurrency counter field. Concurrent write collisions cause Hibernate to issue an <code>ObjectOptimisticLockingFailureException</code> error event, which prompts immediate rollback sequences to maintain systemic isolation ceilings.</p>
    </div>

    <div class="module-block">
        <h3>3. PayFlow Core Wallet & P2P Subsystem <span class="badge">com.neobank.payflow</span></h3>
        <p><strong>Immutable Single Wallet Relationship:</strong> Each distinct profile domain mapping is limited to exactly one digital wallet container entity. During initial setup calls via <code>POST /api/v1/payflow/wallet/initialize</code>, the target client permanently attaches an operational bank account link preference. This structural mapping cannot be altered or re-bound later.</p>
        
        <div class="highlight-box">
            <strong>The ₹1,000 (1k) Floor Safety Limit Mechanics:</strong><br>
            • <strong>Activation Ceiling:</strong> Setup initialization sequences require pulling a base startup resource deposit sizing equal to or exceeding <strong>₹1,000.00</strong> straight from the connected banking instrument.<br>
            • <strong>Floor Constraints:</strong> Core wallet table check limits prevent internal balances from slipping beneath the absolute <strong>₹1,000.00</strong> minimum floor during peer shifts or request settlements.
        </div>
        
        <p><strong>Isolated Balances & Pull Recharges:</strong> System database scopes remain completely isolated. The wallet model touches base with core banking records only during structured recharge procedures triggered at <code>POST /api/v1/payflow/wallet/recharge</code>. Pure peer-to-peer (P2P) transfers operate inside isolated <code>payflow_wallets</code> schemas.</p>
    </div>

    <h2>🎨 Part 2: The Frontend (React + TS + Tailwind v4)</h2>
    <p>The presentation ecosystem is designed as an optimized Single Page Application utilizing <strong>Vite 5</strong> compiler engines, <strong>React 18</strong> framework rules, <strong>TypeScript</strong> code structures, and styled via **Tailwind CSS v4** layout sheets.</p>

    <div class="module-block">
        <h3>1. Aesthetic Design System <span class="badge">index.css</span></h3>
        <p><strong>Apple-Inspired Typography & Spacing:</strong> Embeds the modern, clean <code>Outfit</code> typeface featuring micro-thin layout weights, extra character spacing tracking metrics, and sharp visual grid borders mapped at <code>border-[0.5px] border-zinc-200/60</code>.</p>
        <p><strong>Micro-Animations & Visual Anchors:</strong> Content modules elevate cleanly via <code>hover:-translate-y-0.5</code> physics rules while rendering subtle background box glow shadows. Alert prompts slide onto screens from the left margin, nesting at the <strong>top-left corner</strong> (<code>fixed top-6 left-6 z-[99999]</code>) using dark contrast plates to preserve crisp layer separation guidelines over lower visual structures.</p>
    </div>

    <div class="module-block">
        <h3>2. Unified Workspace Portals <span class="badge">App.tsx</span></h3>
        <ul>
            <li><strong>Overview Portal Dashboard:</strong> Renders complete aggregate valuation metrics using thin style typography weights coupled with real-time reactive card components showing linked check assets. Features inline tools to generate new operational accounts easily.</li>
            <li><strong>Transactions Workspace:</strong> Forms handling cash inflows, cash points execution, and inside asset splits. Outputs a live code block mapping the current client-side generated <strong>Idempotency key context tracker</strong>.</li>
            <li><strong>Ledger Workspace Audit Logs:</strong> Clean structural accounting sheets tabulating double-entry logs, compiling clear credit/debit transaction paths, execution reference codes, and updated balance metrics.</li>
            <li><strong>PayFlow Wallet Workspace Portal:</strong> Renders an animated virtual card component displaying balance configurations, user strings, and connected ledger pathways. Handles linking workflows (enforcing the base ₹1,000 activation parameters), instant peer transfers, and provides an actionable requests activity dashboard panel.</li>
        </ul>
    </div>

    <div class="module-block">
        <h3>3. Automated Security Token Handshake Sequence</h3>
        <p>Toggling the **"Live Mode"** control switch widget triggers an immediate operational profile migration from localized state simulations to the active backend runtime processing on <strong>port 8081</strong>. This zero-configuration automated pipeline runs the following background sequence sequence:</p>
        <pre>
1. POST /api/v1/auth/signup  --> Registers default credentials (jane_doe / Password123!)
2. POST /api/v1/auth/login   --> Secures signed stateless JJWT accessToken string
3. State Interception Hook  --> Saves bearer token in state and appends Authorization headers
4. System Refresh            --> Synchronizes all operational account values instantly from the database</pre>
    </div>

</body>
</html>"""

with open("neobank_architecture_guide.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Architecture assets compiled successfully with Zero-Dependencies!")