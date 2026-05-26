package com.neobank.banking.transaction.service.impl;

import com.neobank.auth.model.User;
import com.neobank.auth.model.UserPrincipal;
import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.repository.AccountRepository;
import com.neobank.banking.account.service.AccountService;
import com.neobank.banking.transaction.dto.DepositRequest;
import com.neobank.banking.transaction.dto.TransactionResponse;
import com.neobank.banking.transaction.dto.TransferRequest;
import com.neobank.banking.transaction.dto.WithdrawRequest;
import com.neobank.banking.transaction.model.*;
import com.neobank.banking.transaction.repository.LedgerEntryRepository;
import com.neobank.banking.transaction.repository.TransactionRepository;
import com.neobank.banking.transaction.service.TransactionService;
import com.neobank.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;

    private static final NumberFormat INR_FORMAT = NumberFormat.getCurrencyInstance(Locale.of("en", "IN"));

    // ─── Deposit ──────────────────────────────────────────────────

    @Override
    @Transactional
    public TransactionResponse deposit(DepositRequest request) {
        // 1. Check Idempotency
        Transaction existingTx = checkIdempotency(request.getIdempotencyKey(), request.getAmount());
        if (existingTx != null) {
            log.info("Idempotent deposit request processed for key: {}", request.getIdempotencyKey());
            return mapToResponse(existingTx);
        }

        // 2. Fetch and Validate Account
        Account account = accountService.findAccountById(request.getAccountId());
        accountService.validateAccountActive(account);

        try {
            // 3. Update Balance
            BigDecimal oldBalance = account.getBalance();
            BigDecimal newBalance = oldBalance.add(request.getAmount());
            account.setBalance(newBalance);
            account = accountRepository.save(account);

            // 4. Create Transaction
            String reference = generateReference();
            Transaction transaction = Transaction.builder()
                    .toAccount(account)
                    .amount(request.getAmount())
                    .type(TransactionType.DEPOSIT)
                    .status(TransactionStatus.SUCCESS)
                    .reference(reference)
                    .description(request.getDescription())
                    .idempotencyKey(request.getIdempotencyKey())
                    .build();
            transaction = transactionRepository.save(transaction);

            // 5. Create Ledger Entry (Double-Entry: CREDIT to customer account)
            LedgerEntry creditEntry = LedgerEntry.builder()
                    .account(account)
                    .transaction(transaction)
                    .type(LedgerEntryType.CREDIT)
                    .amount(request.getAmount())
                    .balanceAfter(newBalance)
                    .build();
            ledgerEntryRepository.save(creditEntry);

            log.info("Deposit of {} successful for account [{}]. Reference: {}", 
                    INR_FORMAT.format(request.getAmount()), account.getAccountNumber(), reference);

            return mapToResponse(transaction);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.error("Concurrent update failure during deposit: {}", e.getMessage());
            throw new AppException("Concurrent update detected. Please try your request again.", HttpStatus.CONFLICT);
        }
    }

    // ─── Withdraw ─────────────────────────────────────────────────

    @Override
    @Transactional
    public TransactionResponse withdraw(WithdrawRequest request) {
        // 1. Check Idempotency
        Transaction existingTx = checkIdempotency(request.getIdempotencyKey(), request.getAmount());
        if (existingTx != null) {
            log.info("Idempotent withdraw request processed for key: {}", request.getIdempotencyKey());
            return mapToResponse(existingTx);
        }

        // 2. Fetch and Validate Account
        Account account = accountService.findAccountById(request.getAccountId());
        
        // Enforce ownership check for withdrawals
        User currentUser = getCurrentUser();
        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new AppException("You do not have access to this account.", HttpStatus.FORBIDDEN);
        }

        accountService.validateAccountActive(account);
        accountService.validateSufficientBalance(account, request.getAmount());

        try {
            // 3. Update Balance
            BigDecimal oldBalance = account.getBalance();
            BigDecimal newBalance = oldBalance.subtract(request.getAmount());
            account.setBalance(newBalance);
            account = accountRepository.save(account);

            // 4. Create Transaction
            String reference = generateReference();
            Transaction transaction = Transaction.builder()
                    .fromAccount(account)
                    .amount(request.getAmount())
                    .type(TransactionType.WITHDRAW)
                    .status(TransactionStatus.SUCCESS)
                    .reference(reference)
                    .description(request.getDescription())
                    .idempotencyKey(request.getIdempotencyKey())
                    .build();
            transaction = transactionRepository.save(transaction);

            // 5. Create Ledger Entry (Double-Entry: DEBIT customer account)
            LedgerEntry debitEntry = LedgerEntry.builder()
                    .account(account)
                    .transaction(transaction)
                    .type(LedgerEntryType.DEBIT)
                    .amount(request.getAmount())
                    .balanceAfter(newBalance)
                    .build();
            ledgerEntryRepository.save(debitEntry);

            log.info("Withdrawal of {} successful for account [{}]. Reference: {}", 
                    INR_FORMAT.format(request.getAmount()), account.getAccountNumber(), reference);

            return mapToResponse(transaction);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.error("Concurrent update failure during withdrawal: {}", e.getMessage());
            throw new AppException("Concurrent update detected. Please try your request again.", HttpStatus.CONFLICT);
        }
    }

    // ─── Transfer ─────────────────────────────────────────────────

    @Override
    @Transactional
    public TransactionResponse transfer(TransferRequest request) {
        // 1. Check Idempotency
        Transaction existingTx = checkIdempotency(request.getIdempotencyKey(), request.getAmount());
        if (existingTx != null) {
            log.info("Idempotent transfer request processed for key: {}", request.getIdempotencyKey());
            return mapToResponse(existingTx);
        }

        // 2. Fetch and Validate Source Account
        Account fromAccount = accountService.findAccountById(request.getFromAccountId());
        
        // Enforce ownership check for source account
        User currentUser = getCurrentUser();
        if (!fromAccount.getUser().getId().equals(currentUser.getId())) {
            throw new AppException("You do not have access to this account.", HttpStatus.FORBIDDEN);
        }

        // 3. Fetch and Validate Destination Account
        Account toAccount = accountService.findByAccountNumber(request.getToAccountNumber());

        // Prevent self-transfer
        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new AppException("Source and destination accounts must be different.", HttpStatus.BAD_REQUEST);
        }

        accountService.validateAccountActive(fromAccount);
        accountService.validateAccountActive(toAccount);
        accountService.validateSufficientBalance(fromAccount, request.getAmount());

        try {
            // 4. Update balances
            BigDecimal newFromBalance = fromAccount.getBalance().subtract(request.getAmount());
            fromAccount.setBalance(newFromBalance);
            fromAccount = accountRepository.save(fromAccount);

            BigDecimal newToBalance = toAccount.getBalance().add(request.getAmount());
            toAccount.setBalance(newToBalance);
            toAccount = accountRepository.save(toAccount);

            // 5. Create Transaction
            String reference = generateReference();
            Transaction transaction = Transaction.builder()
                    .fromAccount(fromAccount)
                    .toAccount(toAccount)
                    .amount(request.getAmount())
                    .type(TransactionType.TRANSFER)
                    .status(TransactionStatus.SUCCESS)
                    .reference(reference)
                    .description(request.getDescription())
                    .idempotencyKey(request.getIdempotencyKey())
                    .build();
            transaction = transactionRepository.save(transaction);

            // 6. Create double-entry ledger records
            // DEBIT entry for source account
            LedgerEntry debitEntry = LedgerEntry.builder()
                    .account(fromAccount)
                    .transaction(transaction)
                    .type(LedgerEntryType.DEBIT)
                    .amount(request.getAmount())
                    .balanceAfter(newFromBalance)
                    .build();
            ledgerEntryRepository.save(debitEntry);

            // CREDIT entry for destination account
            LedgerEntry creditEntry = LedgerEntry.builder()
                    .account(toAccount)
                    .transaction(transaction)
                    .type(LedgerEntryType.CREDIT)
                    .amount(request.getAmount())
                    .balanceAfter(newToBalance)
                    .build();
            ledgerEntryRepository.save(creditEntry);

            log.info("Transfer of {} successful from [{}] to [{}]. Reference: {}", 
                    INR_FORMAT.format(request.getAmount()), fromAccount.getAccountNumber(), toAccount.getAccountNumber(), reference);

            return mapToResponse(transaction);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.error("Concurrent update failure during transfer: {}", e.getMessage());
            throw new AppException("Concurrent update detected during transfer. Please try again.", HttpStatus.CONFLICT);
        }
    }

    // ─── Transaction History ──────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMyTransactionHistory(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<Transaction> transactions = transactionRepository.findAllByUserId(currentUser.getId(), pageable);
        return transactions.map(this::mapToResponse);
    }

    // ─── Idempotency Helper ───────────────────────────────────────

    private Transaction checkIdempotency(String idempotencyKey, BigDecimal amount) {
        return transactionRepository.findByIdempotencyKey(idempotencyKey)
                .map(tx -> {
                    // Safety check: ensure retried transaction matches original amount
                    if (tx.getAmount().compareTo(amount) != 0) {
                        throw new AppException(
                                "Conflict: A transaction with this idempotency key already exists with a different amount.",
                                HttpStatus.CONFLICT
                        );
                    }
                    return tx;
                })
                .orElse(null);
    }

    // ─── Reference Generator ──────────────────────────────────────

    private String generateReference() {
        return "TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    // ─── DTO Mapper ───────────────────────────────────────────────

    private TransactionResponse mapToResponse(Transaction transaction) {
        String fromAccNum = transaction.getFromAccount() != null ? transaction.getFromAccount().getAccountNumber() : "External";
        String fromOwner = transaction.getFromAccount() != null ? transaction.getFromAccount().getUser().getFullName() : "N/A";
        
        String toAccNum = transaction.getToAccount() != null ? transaction.getToAccount().getAccountNumber() : "External";
        String toOwner = transaction.getToAccount() != null ? transaction.getToAccount().getUser().getFullName() : "N/A";

        return TransactionResponse.builder()
                .id(transaction.getId())
                .fromAccountNumber(fromAccNum)
                .fromOwnerName(fromOwner)
                .toAccountNumber(toAccNum)
                .toOwnerName(toOwner)
                .amount(transaction.getAmount())
                .formattedAmount(INR_FORMAT.format(transaction.getAmount()))
                .type(transaction.getType())
                .status(transaction.getStatus())
                .reference(transaction.getReference())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    // ─── Current User Helper ──────────────────────────────────────

    private User getCurrentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        return principal.getUser();
    }
}
