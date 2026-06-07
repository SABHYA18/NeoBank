package com.neobank.clearledger.dto;

import com.neobank.clearledger.model.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {

    private BigDecimal totalSpent;
    private String formattedTotalSpent;
    private List<CategorySpend> byCategory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySpend {
        private ExpenseCategory category;
        private BigDecimal amount;
        private String formattedAmount;
    }
}
