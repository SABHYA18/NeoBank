package com.neobank.banking.account.service.impl;

import com.neobank.auth.model.User;
import com.neobank.auth.model.UserPrincipal;
import com.neobank.banking.account.dto.AccountDto;
import com.neobank.banking.account.dto.CreateAccountRequest;
import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.model.AccountStatus;
import com.neobank.banking.account.repository.AccountRepository;
import com.neobank.banking.account.service.AccountService;
import com.neobank.banking.account.util.AccountNumberGenerator;
import com.neobank.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

/**
 * Implementation of {@link AccountService}.
 * Core banking — account creation, retrieval, and shared validation helpers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final AccountNumberGenerator accountNumberGenerator;

    // INR format: ₹1,23,456.78 (Indian numbering system)
    private static final NumberFormat INR_FORMAT = NumberFormat.getCurrencyInstance(Locale.of("en", "IN"));

    // ─── Create Account ───────────────────────────────────────────

    @Override
    @Transactional
    public AccountDto createAccount(CreateAccountRequest request) {
        User currentUser = getCurrentUser();

        // Enforce maximum 2 accounts rule: Checking and Savings only, and max 1 of each type
        List<Account> existingAccounts = accountRepository.findByUserId(currentUser.getId());
        if (existingAccounts.size() >= 2) {
            throw new AppException("User has reached the maximum limit of 2 banking accounts.", HttpStatus.BAD_REQUEST);
        }
        boolean hasSameType = existingAccounts.stream()
                .anyMatch(acc -> acc.getType() == request.getType());
        if (hasSameType) {
            throw new AppException("User already has a " + request.getType() + " account. Only one account of each type is permitted.", HttpStatus.BAD_REQUEST);
        }

        // Generate unique 10-digit account number with collision retry
        String accountNumber;
        int attempts = 0;
        do {
            accountNumber = accountNumberGenerator.generate();
            if (++attempts > 10) {
                throw new AppException("Failed to generate a unique account number. Please try again.",
                        HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } while (accountRepository.existsByAccountNumber(accountNumber));

        Account account = Account.builder()
                .accountNumber(accountNumber)
                .user(currentUser)
                .type(request.getType())
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        account = accountRepository.save(account);
        log.info("Opened {} account [{}] for user: {}", account.getType(), account.getAccountNumber(), currentUser.getEmail());

        return mapToDto(account);
    }

    // ─── Get All Accounts ─────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<AccountDto> getMyAccounts() {
        User currentUser = getCurrentUser();
        return accountRepository.findByUserId(currentUser.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─── Get Single Account ───────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AccountDto getAccount(String accountId) {
        User currentUser = getCurrentUser();
        Account account = findAccountById(accountId);

        // Ownership check — admin bypass can be added later with @PreAuthorize
        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new AppException("You do not have access to this account.", HttpStatus.FORBIDDEN);
        }

        return mapToDto(account);
    }

    // ─── Internal Finders (used by Transaction module) ────────────

    @Override
    public Account findAccountById(String accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new AppException("Account not found with ID: " + accountId, HttpStatus.NOT_FOUND));
    }

    @Override
    public Account findByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AppException("Account not found: " + accountNumber, HttpStatus.NOT_FOUND));
    }

    // ─── Validation Helpers (used by Transaction module) ──────────

    @Override
    public void validateAccountActive(Account account) {
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(
                    "Account " + account.getAccountNumber() + " is " + account.getStatus().name().toLowerCase() + ".",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @Override
    public void validateSufficientBalance(Account account, BigDecimal amount) {
        if (account.getBalance().compareTo(amount) < 0) {
            throw new AppException(
                    "Insufficient balance. Available: " + INR_FORMAT.format(account.getBalance()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    // ─── DTO Mapper (used by Transaction module) ──────────────────

    @Override
    public AccountDto mapToDto(Account account) {
        return AccountDto.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .ownerName(account.getUser().getFullName())
                .type(account.getType())
                .balance(account.getBalance())
                .formattedBalance(INR_FORMAT.format(account.getBalance()))
                .status(account.getStatus())
                .currency(account.getCurrency())
                .createdAt(account.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public AccountDto updateBalance(String accountId, BigDecimal newBalance) {
        User currentUser = getCurrentUser();
        Account account = findAccountById(accountId);

        // Enforce ownership check
        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new AppException("You do not have access to this account.", HttpStatus.FORBIDDEN);
        }

        account.setBalance(newBalance.add(account.getBalance()));
        account = accountRepository.save(account);
        log.info("Manually set balance of account [{}] to {} for user: {}", 
                account.getAccountNumber(), newBalance, currentUser.getEmail());

        return mapToDto(account);
    }

    // ─── Auth Helper ──────────────────────────────────────────────

    private User getCurrentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        return principal.getUser();
    }
}
