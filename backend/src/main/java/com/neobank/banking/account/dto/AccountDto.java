package com.neobank.banking.account.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.neobank.banking.account.model.AccountStatus;
import com.neobank.banking.account.model.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for returning account information to the client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AccountDto {
    private String id;
    private String accountNumber;
    private String ownerName;
    private AccountType type;
    private BigDecimal balance;
    private String formattedBalance; // e.g. "₹1,23,456.78"
    private AccountStatus status;
    private String currency;
    private LocalDateTime createdAt;
}
