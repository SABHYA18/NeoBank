package com.neobank.clearledger.dto;

import com.neobank.clearledger.model.BudgetPeriod;
import com.neobank.clearledger.model.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetDto {

    private String id;
    private ExpenseCategory category;
    private BigDecimal limitAmount;
    private String formattedLimit;
    private BudgetPeriod period;
    private BigDecimal spentAmount;
    private String formattedSpent;
    private BigDecimal remainingAmount;
    private String formattedRemaining;
    private LocalDateTime createdAt;
}
