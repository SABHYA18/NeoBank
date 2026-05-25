package com.neobank.banking.account.dto;

import com.neobank.banking.account.model.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for POST /api/v1/accounts
 */
@Data
public class CreateAccountRequest {

    @NotNull(message = "Account type is required (CHECKING or SAVINGS)")
    private AccountType type;
}
