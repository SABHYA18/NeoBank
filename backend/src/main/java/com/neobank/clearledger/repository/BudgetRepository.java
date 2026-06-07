package com.neobank.clearledger.repository;

import com.neobank.clearledger.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, String> {
    List<Budget> findByUserIdOrderByCategoryAsc(String userId);
    Optional<Budget> findByUserIdAndCategory(String userId, com.neobank.clearledger.model.ExpenseCategory category);
}
