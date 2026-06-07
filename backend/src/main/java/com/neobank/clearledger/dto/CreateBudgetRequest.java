package com.neobank.clearledger.dto;

import com.neobank.clearledger.model.BudgetPeriod;
import com.neobank.clearledger.model.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBudgetRequest {

    @NotNull
    private ExpenseCategory category;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal limitAmount;

    @NotNull
    private BudgetPeriod period;
}
