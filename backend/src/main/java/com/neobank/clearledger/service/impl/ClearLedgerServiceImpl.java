package com.neobank.clearledger.service.impl;

import com.neobank.auth.model.User;
import com.neobank.clearledger.dto.*;
import com.neobank.clearledger.model.Budget;
import com.neobank.clearledger.model.BudgetPeriod;
import com.neobank.clearledger.model.Expense;
import com.neobank.clearledger.model.ExpenseCategory;
import com.neobank.clearledger.repository.BudgetRepository;
import com.neobank.clearledger.repository.ExpenseRepository;
import com.neobank.clearledger.service.ClearLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClearLedgerServiceImpl implements ClearLedgerService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;

    private static final NumberFormat INR = NumberFormat.getCurrencyInstance(Locale.of("en", "IN"));

    @Override
    @Transactional
    public ExpenseDto createExpense(User user, CreateExpenseRequest request) {
        Expense expense = Expense.builder()
                .user(user)
                .amount(request.getAmount())
                .category(request.getCategory())
                .description(request.getDescription())
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .build();
        return mapExpense(expenseRepository.save(expense));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseDto> listExpenses(User user, ExpenseCategory category, LocalDate fromDate, LocalDate toDate) {
        return expenseRepository.findFiltered(user.getId(), category, fromDate, toDate).stream()
                .map(this::mapExpense)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BudgetDto createOrUpdateBudget(User user, CreateBudgetRequest request) {
        Budget budget = budgetRepository.findByUserIdAndCategory(user.getId(), request.getCategory())
                .orElse(Budget.builder()
                        .user(user)
                        .category(request.getCategory())
                        .build());
        budget.setLimitAmount(request.getLimitAmount());
        budget.setPeriod(request.getPeriod());
        return mapBudget(budgetRepository.save(budget), user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BudgetDto> listBudgets(User user) {
        return budgetRepository.findByUserIdOrderByCategoryAsc(user.getId()).stream()
                .map(b -> mapBudget(b, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsDto getAnalytics(User user, LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        List<Object[]> rows = expenseRepository.sumByCategory(user.getId(), from, to);
        List<AnalyticsDto.CategorySpend> byCategory = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (Object[] row : rows) {
            ExpenseCategory category = (ExpenseCategory) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            total = total.add(amount);
            byCategory.add(AnalyticsDto.CategorySpend.builder()
                    .category(category)
                    .amount(amount)
                    .formattedAmount(INR.format(amount))
                    .build());
        }

        return AnalyticsDto.builder()
                .totalSpent(total)
                .formattedTotalSpent(INR.format(total))
                .byCategory(byCategory)
                .build();
    }

    private BudgetDto mapBudget(Budget budget, User user) {
        LocalDate from = budget.getPeriod() == BudgetPeriod.WEEKLY
                ? LocalDate.now().minusDays(6)
                : LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        LocalDate to = LocalDate.now();

        BigDecimal spent = expenseRepository.findFiltered(user.getId(), budget.getCategory(), from, to).stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remaining = budget.getLimitAmount().subtract(spent);

        return BudgetDto.builder()
                .id(budget.getId())
                .category(budget.getCategory())
                .limitAmount(budget.getLimitAmount())
                .formattedLimit(INR.format(budget.getLimitAmount()))
                .period(budget.getPeriod())
                .spentAmount(spent)
                .formattedSpent(INR.format(spent))
                .remainingAmount(remaining)
                .formattedRemaining(INR.format(remaining))
                .createdAt(budget.getCreatedAt())
                .build();
    }

    private ExpenseDto mapExpense(Expense expense) {
        return ExpenseDto.builder()
                .id(expense.getId())
                .amount(expense.getAmount())
                .formattedAmount(INR.format(expense.getAmount()))
                .category(expense.getCategory())
                .description(expense.getDescription())
                .expenseDate(expense.getExpenseDate())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
