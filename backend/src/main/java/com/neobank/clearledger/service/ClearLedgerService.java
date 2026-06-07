package com.neobank.clearledger.service;

import com.neobank.auth.model.User;
import com.neobank.clearledger.dto.*;
import com.neobank.clearledger.model.ExpenseCategory;

import java.time.LocalDate;
import java.util.List;

public interface ClearLedgerService {

    ExpenseDto createExpense(User user, CreateExpenseRequest request);

    List<ExpenseDto> listExpenses(User user, ExpenseCategory category, LocalDate fromDate, LocalDate toDate);

    BudgetDto createOrUpdateBudget(User user, CreateBudgetRequest request);

    List<BudgetDto> listBudgets(User user);

    AnalyticsDto getAnalytics(User user, LocalDate fromDate, LocalDate toDate);
}
