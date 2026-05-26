package com.neobank.banking.transaction.service;

import com.neobank.auth.model.User;
import com.neobank.auth.model.UserPrincipal;
import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.model.AccountStatus;
import com.neobank.banking.account.repository.AccountRepository;
import com.neobank.banking.account.service.AccountService;
import com.neobank.banking.transaction.dto.DepositRequest;
import com.neobank.banking.transaction.dto.TransactionResponse;
import com.neobank.banking.transaction.dto.TransferRequest;
import com.neobank.banking.transaction.dto.WithdrawRequest;
import com.neobank.banking.transaction.model.*;
import com.neobank.banking.transaction.repository.LedgerEntryRepository;
import com.neobank.banking.transaction.repository.TransactionRepository;
import com.neobank.banking.transaction.service.impl.TransactionServiceImpl;
import com.neobank.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AccountService accountService;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    private User testUser;
    private Account userAccount;
    private Account targetAccount;
    private SecurityContext securityContext;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-123")
                .email("test@neobank.com")
                .fullName("John Doe")
                .build();

        userAccount = Account.builder()
                .id("acc-123")
                .accountNumber("1234567890")
                .user(testUser)
                .balance(BigDecimal.valueOf(1000.00))
                .status(AccountStatus.ACTIVE)
                .build();

        targetAccount = Account.builder()
                .id("acc-999")
                .accountNumber("0987654321")
                .user(User.builder().id("user-999").fullName("Recipient").build())
                .balance(BigDecimal.valueOf(500.00))
                .status(AccountStatus.ACTIVE)
                .build();

        // Mock SecurityContextHolder
        securityContext = mock(SecurityContext.class);
        authentication = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(testUser);
        
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getPrincipal()).thenReturn(principal);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testDeposit_Success() {
        DepositRequest request = DepositRequest.builder()
                .accountId("acc-123")
                .amount(BigDecimal.valueOf(500.00))
                .description("Savings deposit")
                .idempotencyKey("idem-dep-1")
                .build();

        when(transactionRepository.findByIdempotencyKey("idem-dep-1")).thenReturn(Optional.empty());
        when(accountService.findAccountById("acc-123")).thenReturn(userAccount);
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.deposit(request);

        assertNotNull(response);
        assertEquals(TransactionType.DEPOSIT, response.getType());
        assertEquals(TransactionStatus.SUCCESS, response.getStatus());
        assertEquals(BigDecimal.valueOf(500.00), response.getAmount());
        assertEquals(BigDecimal.valueOf(1500.00), userAccount.getBalance());

        verify(accountService).validateAccountActive(userAccount);
        verify(ledgerEntryRepository, times(1)).save(any(LedgerEntry.class));
    }

    @Test
    void testWithdraw_Success() {
        WithdrawRequest request = WithdrawRequest.builder()
                .accountId("acc-123")
                .amount(BigDecimal.valueOf(400.00))
                .description("Cash withdrawal")
                .idempotencyKey("idem-with-1")
                .build();

        when(transactionRepository.findByIdempotencyKey("idem-with-1")).thenReturn(Optional.empty());
        when(accountService.findAccountById("acc-123")).thenReturn(userAccount);
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.withdraw(request);

        assertNotNull(response);
        assertEquals(TransactionType.WITHDRAW, response.getType());
        assertEquals(BigDecimal.valueOf(400.00), response.getAmount());
        assertEquals(BigDecimal.valueOf(600.00), userAccount.getBalance());

        verify(accountService).validateAccountActive(userAccount);
        verify(accountService).validateSufficientBalance(userAccount, BigDecimal.valueOf(400.00));
        verify(ledgerEntryRepository, times(1)).save(any(LedgerEntry.class));
    }

    @Test
    void testWithdraw_Forbidden_OtherUserAccount() {
        Account foreignAccount = Account.builder()
                .id("acc-foreign")
                .accountNumber("9999999999")
                .user(User.builder().id("other-user").build())
                .balance(BigDecimal.valueOf(5000.00))
                .build();

        WithdrawRequest request = WithdrawRequest.builder()
                .accountId("acc-foreign")
                .amount(BigDecimal.valueOf(100.00))
                .description("Illegal withdrawal")
                .idempotencyKey("idem-with-2")
                .build();

        when(transactionRepository.findByIdempotencyKey("idem-with-2")).thenReturn(Optional.empty());
        when(accountService.findAccountById("acc-foreign")).thenReturn(foreignAccount);

        AppException ex = assertThrows(AppException.class, () -> transactionService.withdraw(request));
        assertEquals("You do not have access to this account.", ex.getMessage());
    }

    @Test
    void testTransfer_Success() {
        TransferRequest request = TransferRequest.builder()
                .fromAccountId("acc-123")
                .toAccountNumber("0987654321")
                .amount(BigDecimal.valueOf(300.00))
                .description("Rent transfer")
                .idempotencyKey("idem-trans-1")
                .build();

        when(transactionRepository.findByIdempotencyKey("idem-trans-1")).thenReturn(Optional.empty());
        when(accountService.findAccountById("acc-123")).thenReturn(userAccount);
        when(accountService.findByAccountNumber("0987654321")).thenReturn(targetAccount);
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.transfer(request);

        assertNotNull(response);
        assertEquals(TransactionType.TRANSFER, response.getType());
        assertEquals(BigDecimal.valueOf(300.00), response.getAmount());
        assertEquals(BigDecimal.valueOf(700.00), userAccount.getBalance());
        assertEquals(BigDecimal.valueOf(800.00), targetAccount.getBalance());

        verify(accountService).validateAccountActive(userAccount);
        verify(accountService).validateAccountActive(targetAccount);
        verify(accountService).validateSufficientBalance(userAccount, BigDecimal.valueOf(300.00));
        
        // Double-entry validation: should save 2 ledger entries (debit & credit)
        verify(ledgerEntryRepository, times(2)).save(any(LedgerEntry.class));
    }

    @Test
    void testCheckIdempotency_ReturnsExistingTransaction() {
        Transaction mockTx = Transaction.builder()
                .id("tx-old")
                .amount(BigDecimal.valueOf(100.00))
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .reference("TXN-EXISTING")
                .description("Mock Deposit")
                .idempotencyKey("idem-key-existing")
                .build();

        DepositRequest request = DepositRequest.builder()
                .accountId("acc-123")
                .amount(BigDecimal.valueOf(100.00))
                .description("Mock Deposit")
                .idempotencyKey("idem-key-existing")
                .build();

        when(transactionRepository.findByIdempotencyKey("idem-key-existing")).thenReturn(Optional.of(mockTx));

        TransactionResponse response = transactionService.deposit(request);

        assertNotNull(response);
        assertEquals("TXN-EXISTING", response.getReference());
        // Verify balance was NOT updated or saved again since it's idempotent
        verify(accountRepository, never()).save(any(Account.class));
    }
}
