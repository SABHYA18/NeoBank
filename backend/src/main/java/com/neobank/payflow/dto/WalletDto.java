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
public class WalletDto {

    private String id;
    private String username;
    private String ownerName;
    private BigDecimal balance;
    private String formattedBalance;
    private String currency;
    private boolean active;
    private LocalDateTime updatedAt;
}
