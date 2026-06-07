package com.neobank.clearledger.repository;

import com.neobank.clearledger.model.Expense;
import com.neobank.clearledger.model.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {

    List<Expense> findByUserIdOrderByExpenseDateDescCreatedAtDesc(String userId);

    @Query("""
            SELECT e FROM Expense e
            WHERE e.user.id = :userId
            AND (:category IS NULL OR e.category = :category)
            AND (:fromDate IS NULL OR e.expenseDate >= :fromDate)
            AND (:toDate IS NULL OR e.expenseDate <= :toDate)
            ORDER BY e.expenseDate DESC, e.createdAt DESC
            """)
    List<Expense> findFiltered(
            @Param("userId") String userId,
            @Param("category") ExpenseCategory category,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
            SELECT e.category, SUM(e.amount)
            FROM Expense e
            WHERE e.user.id = :userId
            AND e.expenseDate >= :fromDate
            AND e.expenseDate <= :toDate
            GROUP BY e.category
            """)
    List<Object[]> sumByCategory(
            @Param("userId") String userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );
}
