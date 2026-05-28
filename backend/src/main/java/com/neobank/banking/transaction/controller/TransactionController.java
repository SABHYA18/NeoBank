package com.neobank.banking.transaction.controller;

import com.neobank.banking.transaction.dto.DepositRequest;
import com.neobank.banking.transaction.dto.TransactionResponse;
import com.neobank.banking.transaction.dto.TransferRequest;
import com.neobank.banking.transaction.dto.WithdrawRequest;
import com.neobank.banking.transaction.service.TransactionService;
import com.neobank.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "💳 Transactions", description = "Transaction management operations (Deposit, Withdraw, Transfer, History)")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/deposit")
    @Operation(summary = "Deposit money into an account", description = "Credits the specified checking or savings account")
    public ResponseEntity<ApiResponse<TransactionResponse>> deposit(@Valid @RequestBody DepositRequest request) {
        TransactionResponse response = transactionService.deposit(request);
        return ResponseEntity.ok(ApiResponse.success("Deposit processed successfully.", response));
    }

    @PostMapping("/withdraw")
    @Operation(summary = "Withdraw money from an account", description = "Debits the specified account after checking balance and ownership")
    public ResponseEntity<ApiResponse<TransactionResponse>> withdraw(@Valid @RequestBody WithdrawRequest request) {
        TransactionResponse response = transactionService.withdraw(request);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal processed successfully.", response));
    }

    @PostMapping("/transfer")
    @Operation(summary = "Transfer money to another account", description = "Performs an atomic double-entry transfer between two accounts")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(@Valid @RequestBody TransferRequest request) {
        TransactionResponse response = transactionService.transfer(request);
        return ResponseEntity.ok(ApiResponse.success("Transfer completed successfully.", response));
    }

    @GetMapping("/transaction-history")
    @Operation(summary = "Get transaction history for the authenticated user", description = "Returns a paginated list of all deposits, withdrawals, and transfers")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getMyTransactionHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<TransactionResponse> transactions = transactionService.getMyTransactionHistory(
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.success("Transaction history retrieved successfully.", transactions));
    }
}
