package com.neobank.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / OpenAPI 3 configuration.
 * Access at: http://localhost:8080/swagger-ui.html
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "🏦 NeoBank API",
        version = "1.0.0",
        description = """
                NeoBank Super-App REST API
                
                **Modules:**
                - 🔐 Auth — Login, Signup, Token Refresh
                - 👤 Users — Profile, Settings
                - 🏦 Banking — Accounts, Balances, Statements
                - 💳 Transactions — Deposits, Withdrawals, Transfers (Phase 2)
                - 💸 PayFlow — P2P Payments, Requests (Phase 3)
                - 📊 ClearLedger — Expense Tracking, Budgets (Phase 4)
                
                **Currency:** INR (₹)
                """,
        contact = @Contact(name = "NeoBank Dev Team")
    ),
    servers = @Server(url = "http://localhost:8080", description = "Local Development"),
    security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "Enter your JWT access token (from /auth/login or /auth/signup)"
)
public class OpenApiConfig {
}
