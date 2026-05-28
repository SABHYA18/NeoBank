package com.neobank.payflow.dto;

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
public class P2PResponse {

    private String id;
    private String fromUsername;
    private String fromFullName;
    private String toUsername;
    private String toFullName;
    private BigDecimal amount;
    private String formattedAmount;
    private String status;
    private String note;
    private LocalDateTime createdAt;
}
