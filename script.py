import json

# 1. POSTMAN COLLECTION CONFIGURATION
postman_collection = {
    "info": {
        "_postman_id": "neobank-superapp-collection-uuid",
        "name": "NeoBank Super-App API Reference",
        "description": "Chronological API Reference collection for the NeoBank Super-App ecosystem.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "🔐 1. Authentication Layer",
            "item": [
                {
                    "name": "Sign Up / Register",
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "email": "customer@neobank.com",
                                "username": "customer_neobank",
                                "password": "Password123!",
                                "fullName": "Jane Doe"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/auth/signup",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "auth", "signup"]
                        }
                    }
                },
                {
                    "name": "Log In / Authenticate",
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "var jsonData = pm.response.json();",
                                    "if (jsonData.success && jsonData.data && jsonData.data.accessToken) {",
                                    "    pm.environment.set(\"accessToken\", jsonData.data.accessToken);",
                                    "}"
                                ]
                            }
                        }
                    ],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"email": "customer@neobank.com", "password": "Password123!"}, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/auth/login",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "auth", "login"]
                        }
                    }
                }
            ]
        },
        {
            "name": "🏦 2. Account Management Layer",
            "item": [
                {
                    "name": "Open a New Account",
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
                        }
                    }
                },
                {
                    "name": "List My Accounts",
                    "request": {
                        "method": "GET",
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/accounts",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "accounts"]
                        }
                    }
                }
            ]
        },
        {
            "name": "💳 3. Core Transactions & Ledger Layer",
            "item": [
                {
                    "name": "Deposit Funds",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "X-Idempotency-Key", "value": "dep-idem-key-001"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "accountId": "acc-uuid-1234",
                                "amount": 10000.00,
                                "description": "Initial account deposit",
                                "idempotencyKey": "dep-idem-key-001"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/transactions/deposit",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "transactions", "deposit"]
                        }
                    }
                },
                {
                    "name": "Peer-to-Peer Transfer",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "X-Idempotency-Key", "value": "trans-idem-key-001"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "fromAccountId": "acc-uuid-1234",
                                "toAccountNumber": "0987654321",
                                "amount": 2500.00,
                                "description": "Rent payment",
                                "idempotencyKey": "trans-idem-key-001"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/transactions/transfer",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "transactions", "transfer"]
                        }
                    }
                }
            ]
        },
        {
            "name": "💸 4. PayFlow Wallet Layer",
            "item": [
                {
                    "name": "Execute Smart Payment",
                    "request": {
                        "method": "POST",
                        "header": [
                            {"key": "Content-Type", "value": "application/json"},
                            {"key": "X-Idempotency-Key", "value": "payflow-idem-key-001"}
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "walletId": "wallet-uuid-5555",
                                "type": "BILL",
                                "amount": 1250.00,
                                "metadata": {
                                    "billerId": "ELECTRIC-MSEB-02",
                                    "consumerNumber": "9876543210"
                                },
                                "idempotencyKey": "payflow-idem-key-001"
                            }, indent=2)
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/v1/payflow/pay",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "v1", "payflow", "pay"]
                        }
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
        {"key": "baseUrl", "value": "https://api.neobank-superapp.local", "type": "string"},
        {"key": "accessToken", "value": "your_jwt_access_token", "type": "string"}
    ]
}

# Export Postman collection
with open("neobank_postman_collection.json", "w", encoding="utf-8") as f:
    json.dump(postman_collection, f, indent=4)

# 2. GENERATE COMPREHENSIVE STATIC HTML DOCUMENT
html_content = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>NeoBank Super-App API Contract Reference</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 40px auto; padding: 0 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #2980b9; margin-top: 40px; border-left: 4px solid #3498db; padding-left: 10px; }
        .endpoint { background: #f8f9fa; border: 1px solid #eaeded; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .method { display: inline-block; padding: 3px 8px; font-weight: bold; color: #fff; border-radius: 3px; font-size: 12px; margin-right: 10px; }
        .post { background: #2ecc71; }
        .get { background: #3498db; }
        .path { font-family: monospace; font-size: 14px; font-weight: bold; color: #2c3e50; }
        .meta { margin-bottom: 30px; background: #ebf5fb; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>NeoBank Super-App API Contract Reference</h1>
    <p><strong>System Topology Release:</strong> 1.0.4-RELEASE</p>
    
    <div class="meta">
        <strong>Global Base URL:</strong> <code>https://api.neobank-superapp.local</code><br>
        <strong>Authentication Scheme:</strong> JSON Web Token (JJWT Bearer Standard Validation Header)
    </div>

    <h2>🔐 1. Authentication Layer (Public)</h2>
    <div class="endpoint">
        <span class="method post">POST</span><span class="path">/api/v1/auth/signup</span>
        <p>Registers a brand new customer user entity within the persistent system security context mapping tables.</p>
    </div>
    <div class="endpoint">
        <span class="method post">POST</span><span class="path">/api/v1/auth/login</span>
        <p>Validates account credentials and issues signed runtime authentication tokens.</p>
    </div>

    <h2>🏦 2. Account Management Layer (Authenticated)</h2>
    <div class="endpoint">
        <span class="method post">POST</span><span class="path">/api/v1/accounts</span>
        <p>Provisions a new core CHECKING or SAVINGS banking element linked directly to the client context profile.</p>
    </div>
    <div class="endpoint">
        <span class="method get">GET</span><span class="path">/api/v1/accounts</span>
        <p>Returns a summary list of all financial ledger balances held by the authorized user session.</p>
    </div>

    <h2>💳 3. Core Transactions & System Ledger</h2>
    <div class="endpoint">
        <span class="method post">POST</span><span class="path">/api/v1/transactions/deposit</span>
        <p>Executes an atomic balance top-up event. Enforces idempotency via payload tracking tokens.</p>
    </div>
    <div class="endpoint">
        <span class="method post">POST</span><span class="path">/api/v1/transactions/transfer</span>
        <p>Performs a reliable, atomic, double-entry asset shift sequence across regional checking target mappings.</p>
    </div>

    <h2>💸 4. PayFlow Polymorphic Wallet</h2>
    <div class="endpoint">
        <span class="method post">POST</span><span class="path">/api/v1/payflow/pay</span>
        <p>Dynamically routes third-party vendor requests (BILL, BOOKING, RECHARGE) through injected internal runtime strategies using a loose coupling factory pattern layout.</p>
    </div>
</body>
</html>"""

with open("neobank_api_documentation.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Files generated successfully with zero dependencies!")