package com.neobank.banking.account.controller;

import com.neobank.banking.account.dto.AccountDto;
import com.neobank.banking.account.dto.CreateAccountRequest;
import com.neobank.banking.account.service.AccountService;
import com.neobank.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Account endpoints — requires authentication.
 *
 * POST   /api/v1/accounts           — create new account
 * GET    /api/v1/accounts           — list all my accounts
 * GET    /api/v1/accounts/{id}      — get single account by ID
 * GET    /api/v1/accounts/{id}/balance — get just the balance
 */
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "🏦 Accounts", description = "Bank account management")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    @Operation(summary = "Open a new bank account", description = "Creates a CHECKING or SAVINGS account for the authenticated user")
    public ResponseEntity<ApiResponse<AccountDto>> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountDto account = accountService.createAccount(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account opened successfully.", account));
    }

    @GetMapping
    @Operation(summary = "List all my accounts")
    public ResponseEntity<ApiResponse<List<AccountDto>>> getMyAccounts() {
        List<AccountDto> accounts = accountService.getMyAccounts();
        return ResponseEntity.ok(ApiResponse.success("Accounts retrieved.", accounts));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account details by ID")
    public ResponseEntity<ApiResponse<AccountDto>> getAccount(@PathVariable String id) {
        AccountDto account = accountService.getAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Account retrieved.", account));
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "Get account balance")
    public ResponseEntity<ApiResponse<Object>> getBalance(@PathVariable String id) {
        AccountDto account = accountService.getAccount(id);
        var balanceInfo = new java.util.LinkedHashMap<String, Object>();
        balanceInfo.put("accountNumber", account.getAccountNumber());
        balanceInfo.put("balance", account.getBalance());
        balanceInfo.put("formattedBalance", account.getFormattedBalance());
        balanceInfo.put("currency", account.getCurrency());
        return ResponseEntity.ok(ApiResponse.success("Balance retrieved.", balanceInfo));
    }

    @PutMapping("/{id}/balance")
    @Operation(summary = "Manually update account balance", description = "Sets the account balance directly for testing/simulation purposes")
    public ResponseEntity<ApiResponse<AccountDto>> updateBalance(
            @PathVariable String id,
            @RequestParam java.math.BigDecimal balance) {
        AccountDto account = accountService.updateBalance(id, balance);
        return ResponseEntity.ok(ApiResponse.success("Account balance updated successfully.", account));
    }
}
