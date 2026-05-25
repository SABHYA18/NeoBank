package com.neobank.banking.account.service;

import com.neobank.auth.model.User;
import com.neobank.auth.model.UserPrincipal;
import com.neobank.banking.account.dto.AccountDto;
import com.neobank.banking.account.dto.CreateAccountRequest;
import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.model.AccountStatus;
import com.neobank.banking.account.repository.AccountRepository;
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
 * Core banking — account management service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountNumberGenerator accountNumberGenerator;

    // Indian number format for INR display (e.g. ₹1,23,456.78)
    private static final NumberFormat INR_FORMAT = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));

    // ─── Create Account ───────────────────────────────────────────

    @Transactional
    public AccountDto createAccount(CreateAccountRequest request) {
        User currentUser = getCurrentUser();

        // Generate a unique account number (retry on collision)
        String accountNumber;
        int attempts = 0;
        do {
            accountNumber = accountNumberGenerator.generate();
            attempts++;
            if (attempts > 10) {
                throw new AppException("Failed to generate unique account number. Please try again.", HttpStatus.INTERNAL_SERVER_ERROR);
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
        log.info("Created {} account {} for user {}", account.getType(), account.getAccountNumber(), currentUser.getEmail());

        return mapToDto(account);
    }

    // ─── Get All Accounts ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AccountDto> getMyAccounts() {
        User currentUser = getCurrentUser();
        return accountRepository.findByUserId(currentUser.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─── Get Single Account ───────────────────────────────────────

    @Transactional(readOnly = true)
    public AccountDto getAccount(String accountId) {
        User currentUser = getCurrentUser();
        Account account = findAccountById(accountId);

        // Ensure the account belongs to the requesting user
        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new AppException("You do not have access to this account.", HttpStatus.FORBIDDEN);
        }

        return mapToDto(account);
    }

    // ─── Internal: Find & Validate ───────────────────────────────

    public Account findAccountById(String accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new AppException("Account not found with ID: " + accountId, HttpStatus.NOT_FOUND));
    }

    public Account findByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AppException("Account not found: " + accountNumber, HttpStatus.NOT_FOUND));
    }

    // ─── Internal: Auth Helper ────────────────────────────────────

    private User getCurrentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        return principal.getUser();
    }

    // ─── Internal: Mapping ────────────────────────────────────────

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

    public void validateAccountActive(Account account) {
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(
                    "Account " + account.getAccountNumber() + " is " + account.getStatus().name().toLowerCase() + ".",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    public void validateSufficientBalance(Account account, BigDecimal amount) {
        if (account.getBalance().compareTo(amount) < 0) {
            throw new AppException(
                    "Insufficient balance. Available: " + INR_FORMAT.format(account.getBalance()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }
}
