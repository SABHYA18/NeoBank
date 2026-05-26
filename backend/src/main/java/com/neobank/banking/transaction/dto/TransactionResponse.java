package com.neobank.banking.transaction.dto;

import com.neobank.banking.transaction.model.TransactionStatus;
import com.neobank.banking.transaction.model.TransactionType;
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
public class TransactionResponse {

    private String id;
    private String fromAccountNumber;
    private String fromOwnerName;
    private String toAccountNumber;
    private String toOwnerName;
    private BigDecimal amount;
    private String formattedAmount;
    private TransactionType type;
    private TransactionStatus status;
    private String reference;
    private String description;
    private LocalDateTime createdAt;
}
