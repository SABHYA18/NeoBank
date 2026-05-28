package com.neobank.banking.account.service;

import com.neobank.auth.model.User;
import com.neobank.auth.model.UserPrincipal;
import com.neobank.banking.account.dto.AccountDto;
import com.neobank.banking.account.dto.CreateAccountRequest;
import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.model.AccountType;
import com.neobank.banking.account.repository.AccountRepository;
import com.neobank.banking.account.service.impl.AccountServiceImpl;
import com.neobank.banking.account.util.AccountNumberGenerator;
import com.neobank.common.exception.AppException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AccountNumberGenerator accountNumberGenerator;

    @InjectMocks
    private AccountServiceImpl accountService;

    private User currentUser;
    private List<Account> existingAccounts;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id("user-123")
                .fullName("Jane Doe")
                .email("jane@neobank.com")
                .username("jane_doe")
                .build();

        existingAccounts = new ArrayList<>();

        // Mock SecurityContextHolder authentication handshake
        UserPrincipal principal = new UserPrincipal(currentUser);
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(principal);
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreateAccount_Success_FirstCheckingAccount() {
        CreateAccountRequest request = new CreateAccountRequest();
        request.setType(AccountType.CHECKING);

        when(accountRepository.findByUserId("user-123")).thenReturn(existingAccounts);
        when(accountNumberGenerator.generate()).thenReturn("9876543210");
        when(accountRepository.existsByAccountNumber("9876543210")).thenReturn(false);
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> {
            Account saved = invocation.getArgument(0);
            saved.setId("acc-new-id");
            return saved;
        });

        AccountDto result = accountService.createAccount(request);

        assertNotNull(result);
        assertEquals(AccountType.CHECKING, result.getType());
        assertEquals("9876543210", result.getAccountNumber());
        assertEquals("Jane Doe", result.getOwnerName());
        verify(accountRepository, times(1)).save(any(Account.class));
    }

    @Test
    void testCreateAccount_Failure_DuplicateCheckingAccount() {
        // User already has one CHECKING account
        Account checkingAcc = Account.builder()
                .id("acc-exist-1")
                .accountNumber("1111111111")
                .type(AccountType.CHECKING)
                .user(currentUser)
                .build();
        existingAccounts.add(checkingAcc);

        CreateAccountRequest request = new CreateAccountRequest();
        request.setType(AccountType.CHECKING); // Trying to open a second CHECKING account

        when(accountRepository.findByUserId("user-123")).thenReturn(existingAccounts);

        AppException ex = assertThrows(AppException.class, () ->
                accountService.createAccount(request)
        );

        assertTrue(ex.getMessage().contains("User already has a CHECKING account"));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    void testCreateAccount_Failure_ExceedsMaxTwoAccounts() {
        // User already has 2 accounts: one CHECKING and one SAVINGS
        Account checkingAcc = Account.builder()
                .id("acc-exist-1")
                .accountNumber("1111111111")
                .type(AccountType.CHECKING)
                .user(currentUser)
                .build();
        Account savingsAcc = Account.builder()
                .id("acc-exist-2")
                .accountNumber("2222222222")
                .type(AccountType.SAVINGS)
                .user(currentUser)
                .build();
        existingAccounts.add(checkingAcc);
        existingAccounts.add(savingsAcc);

        CreateAccountRequest request = new CreateAccountRequest();
        request.setType(AccountType.CHECKING);

        when(accountRepository.findByUserId("user-123")).thenReturn(existingAccounts);

        AppException ex = assertThrows(AppException.class, () ->
                accountService.createAccount(request)
        );

        assertTrue(ex.getMessage().contains("maximum limit of 2 banking accounts"));
        verify(accountRepository, never()).save(any(Account.class));
    }
}
