package com.neobank.payflow.dto;

import com.neobank.payflow.model.PaymentStatus;
import com.neobank.payflow.model.PaymentType;
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
public class WalletPaymentResponse {

    private String id;
    private PaymentType type;
    private BigDecimal amount;
    private String formattedAmount;
    private PaymentStatus status;
    private String referenceNumber;
    private String metadataJson;
    private LocalDateTime createdAt;
}
