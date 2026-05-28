package com.neobank.payflow.service;

import com.neobank.auth.model.User;
import com.neobank.auth.repository.UserRepository;
import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.model.AccountStatus;
import com.neobank.banking.account.service.AccountService;
import com.neobank.banking.transaction.dto.WithdrawRequest;
import com.neobank.banking.transaction.service.TransactionService;
import com.neobank.common.exception.AppException;
import com.neobank.payflow.dto.*;
import com.neobank.payflow.model.PayFlowRequest;
import com.neobank.payflow.model.RequestStatus;
import com.neobank.payflow.model.Wallet;
import com.neobank.payflow.repository.PayFlowRequestRepository;
import com.neobank.payflow.repository.WalletRepository;
import com.neobank.payflow.service.impl.WalletServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private PayFlowRequestRepository payFlowRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountService accountService;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private WalletServiceImpl walletService;

    private User sender;
    private User recipient;
    private Account senderAccount;
    private Wallet senderWallet;
    private Wallet recipientWallet;

    @BeforeEach
    void setUp() {
        sender = User.builder()
                .id("sender-id")
                .username("sender")
                .fullName("Sender User")
                .build();

        recipient = User.builder()
                .id("recipient-id")
                .username("recipient")
                .fullName("Recipient User")
                .build();

        senderAccount = Account.builder()
                .id("acc-123")
                .accountNumber("1234567890")
                .user(sender)
                .balance(BigDecimal.valueOf(5000.00))
                .status(AccountStatus.ACTIVE)
                .build();

        senderWallet = Wallet.builder()
                .id("wallet-sender")
                .user(sender)
                .linkedAccount(senderAccount)
                .balance(BigDecimal.valueOf(1500.00))
                .active(true)
                .build();

        recipientWallet = Wallet.builder()
                .id("wallet-recipient")
                .user(recipient)
                .balance(BigDecimal.valueOf(1200.00))
                .active(true)
                .build();
    }

    @Test
    void testInitializeWallet_Success() {
        when(walletRepository.findByUserId("sender-id")).thenReturn(Optional.empty());
        when(accountService.findAccountById("acc-123")).thenReturn(senderAccount);
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletDto result = walletService.initializeWallet(sender, "acc-123", BigDecimal.valueOf(1500.00));

        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(1500.00), result.getBalance());
        assertEquals("sender", result.getUsername());
        verify(transactionService, times(1)).withdraw(any(WithdrawRequest.class));
    }

    @Test
    void testInitializeWallet_Failure_Under1k() {
        AppException exception = assertThrows(AppException.class, () -> 
            walletService.initializeWallet(sender, "acc-123", BigDecimal.valueOf(800.00))
        );
        assertEquals("Initial wallet load must be at least ₹1,000.00.", exception.getMessage());
        verifyNoInteractions(transactionService);
    }

    @Test
    void testInitializeWallet_Failure_AlreadyExists() {
        when(walletRepository.findByUserId("sender-id")).thenReturn(Optional.of(senderWallet));

        AppException exception = assertThrows(AppException.class, () -> 
            walletService.initializeWallet(sender, "acc-123", BigDecimal.valueOf(1500.00))
        );
        assertEquals("Wallet already initialized for this user.", exception.getMessage());
    }

    @Test
    void testRechargeWallet_Success() {
        when(walletRepository.findByUserId("sender-id")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletDto result = walletService.rechargeWallet(sender, BigDecimal.valueOf(500.00));

        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(2000.00), result.getBalance());
        verify(transactionService, times(1)).withdraw(any(WithdrawRequest.class));
    }

    @Test
    void testSendMoney_Success() {
        SendMoneyRequest request = SendMoneyRequest.builder()
                .toUsername("recipient")
                .amount(BigDecimal.valueOf(400.00))
                .note("Coffee")
                .build();

        when(walletRepository.findByUserId("sender-id")).thenReturn(Optional.of(senderWallet));
        when(userRepository.findByUsername("recipient")).thenReturn(Optional.of(recipient));
        when(walletRepository.findByUserId("recipient-id")).thenReturn(Optional.of(recipientWallet));
        when(payFlowRequestRepository.save(any(PayFlowRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        P2PResponse response = walletService.sendMoney(sender, request);

        assertNotNull(response);
        assertEquals(BigDecimal.valueOf(1100.00), senderWallet.getBalance());
        assertEquals(BigDecimal.valueOf(1600.00), recipientWallet.getBalance());
        assertEquals("ACCEPTED", response.getStatus());
    }

    @Test
    void testSendMoney_Failure_Below1kFloor() {
        SendMoneyRequest request = SendMoneyRequest.builder()
                .toUsername("recipient")
                .amount(BigDecimal.valueOf(600.00)) // 1500 - 600 = 900 (< 1000)
                .note("Rent share")
                .build();

        when(walletRepository.findByUserId("sender-id")).thenReturn(Optional.of(senderWallet));
        when(userRepository.findByUsername("recipient")).thenReturn(Optional.of(recipient));
        when(walletRepository.findByUserId("recipient-id")).thenReturn(Optional.of(recipientWallet));

        AppException exception = assertThrows(AppException.class, () -> 
            walletService.sendMoney(sender, request)
        );
        assertTrue(exception.getMessage().contains("Your wallet balance cannot drop below ₹1,000.00."));
    }

    @Test
    void testAcceptRequest_Success() {
        PayFlowRequest pendingRequest = PayFlowRequest.builder()
                .id("req-999")
                .fromUser(recipient)
                .toUser(sender)
                .amount(BigDecimal.valueOf(300.00))
                .status(RequestStatus.PENDING)
                .build();

        when(payFlowRequestRepository.findById("req-999")).thenReturn(Optional.of(pendingRequest));
        when(walletRepository.findByUserId("sender-id")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserId("recipient-id")).thenReturn(Optional.of(recipientWallet));
        when(payFlowRequestRepository.save(any(PayFlowRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        P2PResponse response = walletService.acceptRequest(sender, "req-999");

        assertNotNull(response);
        assertEquals("ACCEPTED", response.getStatus());
        assertEquals(BigDecimal.valueOf(1200.00), senderWallet.getBalance());
        assertEquals(BigDecimal.valueOf(1500.00), recipientWallet.getBalance());
    }

    @Test
    void testDeclineRequest_Success() {
        PayFlowRequest pendingRequest = PayFlowRequest.builder()
                .id("req-999")
                .fromUser(recipient)
                .toUser(sender)
                .amount(BigDecimal.valueOf(300.00))
                .status(RequestStatus.PENDING)
                .build();

        when(payFlowRequestRepository.findById("req-999")).thenReturn(Optional.of(pendingRequest));
        when(payFlowRequestRepository.save(any(PayFlowRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        P2PResponse response = walletService.declineRequest(sender, "req-999");

        assertNotNull(response);
        assertEquals("DECLINED", response.getStatus());
        verifyNoInteractions(walletRepository);
    }
}
