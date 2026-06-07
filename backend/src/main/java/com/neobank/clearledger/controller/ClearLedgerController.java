package com.neobank.clearledger.controller;

import com.neobank.auth.model.UserPrincipal;
import com.neobank.clearledger.dto.*;
import com.neobank.clearledger.model.ExpenseCategory;
import com.neobank.clearledger.service.ClearLedgerService;
import com.neobank.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/clearledger")
@RequiredArgsConstructor
@Tag(name = "📊 ClearLedger", description = "Expense tracking, budgets, and analytics")
@SecurityRequirement(name = "bearerAuth")
public class ClearLedgerController {

    private final ClearLedgerService clearLedgerService;

    @PostMapping("/expenses")
    @Operation(summary = "Log an expense")
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        ExpenseDto response = clearLedgerService.createExpense(principal.getUser(), request);
        return ResponseEntity.ok(ApiResponse.success("Expense logged.", response));
    }

    @GetMapping("/expenses")
    @Operation(summary = "List expenses with optional filters")
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> listExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ExpenseCategory category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        List<ExpenseDto> response = clearLedgerService.listExpenses(principal.getUser(), category, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Expenses retrieved.", response));
    }

    @PostMapping("/budgets")
    @Operation(summary = "Create or update a category budget")
    public ResponseEntity<ApiResponse<BudgetDto>> upsertBudget(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateBudgetRequest request
    ) {
        BudgetDto response = clearLedgerService.createOrUpdateBudget(principal.getUser(), request);
        return ResponseEntity.ok(ApiResponse.success("Budget saved.", response));
    }

    @GetMapping("/budgets")
    @Operation(summary = "List budgets with spend progress")
    public ResponseEntity<ApiResponse<List<BudgetDto>>> listBudgets(@AuthenticationPrincipal UserPrincipal principal) {
        List<BudgetDto> response = clearLedgerService.listBudgets(principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Budgets retrieved.", response));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Spending analytics by category")
    public ResponseEntity<ApiResponse<AnalyticsDto>> getAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        AnalyticsDto response = clearLedgerService.getAnalytics(principal.getUser(), fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Analytics retrieved.", response));
    }
}
