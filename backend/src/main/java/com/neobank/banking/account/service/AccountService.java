package com.neobank.banking.account.service;

import com.neobank.banking.account.dto.AccountDto;
import com.neobank.banking.account.dto.CreateAccountRequest;
import com.neobank.banking.account.model.Account;

import java.math.BigDecimal;
import java.util.List;

/**
 * Contract for bank account management operations.
 * Implementation: {@link impl.AccountServiceImpl}
 */
public interface AccountService {

    /**
     * Opens a new bank account (CHECKING or SAVINGS) for the authenticated user.
     */
    AccountDto createAccount(CreateAccountRequest request);

    /**
     * Returns all accounts belonging to the authenticated user.
     */
    List<AccountDto> getMyAccounts();

    /**
     * Returns a single account by ID — enforces ownership check.
     */
    AccountDto getAccount(String accountId);

    // ─── Internal helpers used by Transaction module ──────────────

    /**
     * Fetches an Account entity by ID, throws 404 if not found.
     */
    Account findAccountById(String accountId);

    /**
     * Fetches an Account entity by account number, throws 404 if not found.
     */
    Account findByAccountNumber(String accountNumber);

    /**
     * Maps an Account entity to an AccountDto (used by other modules).
     */
    AccountDto mapToDto(Account account);

    /**
     * Throws AppException if the account is not ACTIVE.
     */
    void validateAccountActive(Account account);

    /**
     * Throws AppException if the account balance is less than the required amount.
     */
    void validateSufficientBalance(Account account, BigDecimal amount);

    /**
     * Updates the balance of an account directly — enforces ownership check.
     */
    AccountDto updateBalance(String accountId, BigDecimal newBalance);
}
