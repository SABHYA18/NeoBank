package com.neobank.payflow.service.impl;

import com.neobank.auth.model.User;
import com.neobank.auth.repository.UserRepository;
import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.repository.AccountRepository;
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
import com.neobank.payflow.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final PayFlowRequestRepository payFlowRequestRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;
    private final TransactionService transactionService;

    private static final NumberFormat INR_FORMAT = NumberFormat.getCurrencyInstance(Locale.of("en", "IN"));
    private static final BigDecimal MIN_BALANCE = new BigDecimal("1000.00");

    @Override
    @Transactional(readOnly = true)
    public WalletDto getWalletDetails(User user) {
        Wallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException("Wallet not initialized. Please set up your wallet.", HttpStatus.NOT_FOUND));
        return mapToDto(wallet);
    }

    @Override
    @Transactional
    public WalletDto initializeWallet(User user, String accountId, BigDecimal initialAmount) {
        // Enforce: One Wallet Policy
        if (walletRepository.findByUserId(user.getId()).isPresent()) {
            throw new AppException("Wallet already initialized for this user.", HttpStatus.BAD_REQUEST);
        }

        // Enforce: Minimum Initial Load of 1k
        if (initialAmount.compareTo(MIN_BALANCE) < 0) {
            throw new AppException("Initial wallet load must be at least ₹1,000.00.", HttpStatus.BAD_REQUEST);
        }

        // Fetch & Validate Banking Account
        Account account = accountService.findAccountById(accountId);
        if (!account.getUser().getId().equals(user.getId())) {
            throw new AppException("You can only link accounts belonging to you.", HttpStatus.FORBIDDEN);
        }
        accountService.validateAccountActive(account);

        try {
            // Withdraw initial load from Bank Account using Core Transaction Module
            String idempotencyKey = "WAL-INIT-" + UUID.randomUUID();
            WithdrawRequest withdrawRequest = WithdrawRequest.builder()
                    .accountId(accountId)
                    .amount(initialAmount)
                    .description("Initial PayFlow Wallet Load")
                    .idempotencyKey(idempotencyKey)
                    .build();
            transactionService.withdraw(withdrawRequest);

            // Create and Activate Wallet
            Wallet wallet = Wallet.builder()
                    .user(user)
                    .linkedAccount(account)
                    .balance(initialAmount)
                    .currency("INR")
                    .active(true)
                    .build();

            wallet = walletRepository.save(wallet);
            log.info("Initialized wallet for user {} linked to account {}. Initial balance: {}",
                    user.getUsername(), account.getAccountNumber(), INR_FORMAT.format(initialAmount));

            return mapToDto(wallet);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.error("Optimistic locking failure during wallet initialization: {}", e.getMessage());
            throw new AppException("Concurrent update detected during wallet setup. Please try again.", HttpStatus.CONFLICT);
        }
    }

    @Override
    @Transactional
    public WalletDto rechargeWallet(User user, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Recharge amount must be greater than zero.", HttpStatus.BAD_REQUEST);
        }

        Wallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException("Wallet not initialized. Please set up your wallet.", HttpStatus.NOT_FOUND));

        if (!wallet.isActive()) {
            throw new AppException("Wallet is inactive.", HttpStatus.BAD_REQUEST);
        }

        Account account = wallet.getLinkedAccount();
        accountService.validateAccountActive(account);

        try {
            // Withdraw from immutable Connected Account
            String idempotencyKey = "WAL-RECH-" + UUID.randomUUID();
            WithdrawRequest withdrawRequest = WithdrawRequest.builder()
                    .accountId(account.getId())
                    .amount(amount)
                    .description("PayFlow Wallet Recharge")
                    .idempotencyKey(idempotencyKey)
                    .build();
            transactionService.withdraw(withdrawRequest);

            // Credit Wallet Balance
            wallet.setBalance(wallet.getBalance().add(amount));
            wallet = walletRepository.save(wallet);

            log.info("Recharged wallet of user {} from connected account {}. Loaded amount: {}. New balance: {}",
                    user.getUsername(), account.getAccountNumber(), INR_FORMAT.format(amount), INR_FORMAT.format(wallet.getBalance()));

            return mapToDto(wallet);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.error("Optimistic locking failure during wallet recharge: {}", e.getMessage());
            throw new AppException("Concurrent update detected during wallet recharge. Please try again.", HttpStatus.CONFLICT);
        }
    }

    @Override
    @Transactional
    public P2PResponse sendMoney(User sender, SendMoneyRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Amount must be greater than zero.", HttpStatus.BAD_REQUEST);
        }

        Wallet senderWallet = walletRepository.findByUserId(sender.getId())
                .orElseThrow(() -> new AppException("Your wallet is not initialized.", HttpStatus.BAD_REQUEST));

        if (!senderWallet.isActive()) {
            throw new AppException("Your wallet is inactive.", HttpStatus.BAD_REQUEST);
        }

        // Fetch Recipient User & Wallet
        User recipient = userRepository.findByUsername(request.getToUsername())
                .orElseThrow(() -> new AppException("Recipient username not found.", HttpStatus.NOT_FOUND));

        if (recipient.getId().equals(sender.getId())) {
            throw new AppException("Self-transfers are not allowed.", HttpStatus.BAD_REQUEST);
        }

        Wallet recipientWallet = walletRepository.findByUserId(recipient.getId())
                .orElseThrow(() -> new AppException("Recipient does not have a PayFlow wallet.", HttpStatus.BAD_REQUEST));

        if (!recipientWallet.isActive()) {
            throw new AppException("Recipient wallet is inactive.", HttpStatus.BAD_REQUEST);
        }

        // Enforce: Balance Floor Safeguard (₹1,000)
        BigDecimal resultingBalance = senderWallet.getBalance().subtract(request.getAmount());
        if (resultingBalance.compareTo(MIN_BALANCE) < 0) {
            throw new AppException("Transaction rejected. Your wallet balance cannot drop below ₹1,000.00.", HttpStatus.BAD_REQUEST);
        }

        try {
            // Deduct Sender Balance
            senderWallet.setBalance(resultingBalance);
            walletRepository.save(senderWallet);

            // Credit Recipient Balance
            recipientWallet.setBalance(recipientWallet.getBalance().add(request.getAmount()));
            walletRepository.save(recipientWallet);

            // Log instant transfer in payflow_requests as ACCEPTED
            PayFlowRequest p2pRequest = PayFlowRequest.builder()
                    .fromUser(sender)
                    .toUser(recipient)
                    .amount(request.getAmount())
                    .status(RequestStatus.ACCEPTED)
                    .note(request.getNote() != null ? request.getNote() : "Direct P2P Transfer")
                    .build();

            p2pRequest = payFlowRequestRepository.save(p2pRequest);
            log.info("P2P direct transfer successful: {} sent {} to {}.",
                    sender.getUsername(), INR_FORMAT.format(request.getAmount()), recipient.getUsername());

            return mapToP2PResponse(p2pRequest);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.error("Concurrent conflict during P2P transfer: {}", e.getMessage());
            throw new AppException("Concurrent update detected during P2P transfer. Please try again.", HttpStatus.CONFLICT);
        }
    }

    @Override
    @Transactional
    public P2PResponse requestMoney(User requestor, RequestMoneyRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Amount must be greater than zero.", HttpStatus.BAD_REQUEST);
        }

        // Ensure Requestor has a Wallet
        walletRepository.findByUserId(requestor.getId())
                .orElseThrow(() -> new AppException("Your wallet is not initialized.", HttpStatus.BAD_REQUEST));

        // Fetch Target User & Wallet
        User targetUser = userRepository.findByUsername(request.getFromUsername())
                .orElseThrow(() -> new AppException("Target user not found.", HttpStatus.NOT_FOUND));

        if (targetUser.getId().equals(requestor.getId())) {
            throw new AppException("You cannot request money from yourself.", HttpStatus.BAD_REQUEST);
        }

        walletRepository.findByUserId(targetUser.getId())
                .orElseThrow(() -> new AppException("Target user does not have an active PayFlow wallet.", HttpStatus.BAD_REQUEST));

        // Log PENDING Request
        PayFlowRequest p2pRequest = PayFlowRequest.builder()
                .fromUser(requestor)
                .toUser(targetUser)
                .amount(request.getAmount())
                .status(RequestStatus.PENDING)
                .note(request.getNote() != null ? request.getNote() : "Requested payment")
                .build();

        p2pRequest = payFlowRequestRepository.save(p2pRequest);
        log.info("P2P request created: {} requested {} from {}.",
                requestor.getUsername(), INR_FORMAT.format(request.getAmount()), targetUser.getUsername());

        return mapToP2PResponse(p2pRequest);
    }

    @Override
    @Transactional
    public P2PResponse acceptRequest(User user, String requestId) {
        PayFlowRequest p2pRequest = payFlowRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException("Payment request not found.", HttpStatus.NOT_FOUND));

        // Validation: Verify requested payer is current user
        if (!p2pRequest.getToUser().getId().equals(user.getId())) {
            throw new AppException("You are not authorized to accept this payment request.", HttpStatus.FORBIDDEN);
        }

        if (p2pRequest.getStatus() != RequestStatus.PENDING) {
            throw new AppException("This request is already resolved.", HttpStatus.BAD_REQUEST);
        }

        Wallet payerWallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException("Your wallet is not initialized.", HttpStatus.BAD_REQUEST));

        if (!payerWallet.isActive()) {
            throw new AppException("Your wallet is inactive.", HttpStatus.BAD_REQUEST);
        }

        Wallet requestorWallet = walletRepository.findByUserId(p2pRequest.getFromUser().getId())
                .orElseThrow(() -> new AppException("Requestor wallet is inactive or missing.", HttpStatus.BAD_REQUEST));

        // Enforce: Balance Floor Safeguard (₹1,000)
        BigDecimal resultingBalance = payerWallet.getBalance().subtract(p2pRequest.getAmount());
        if (resultingBalance.compareTo(MIN_BALANCE) < 0) {
            throw new AppException("Transaction rejected. Your wallet balance cannot drop below ₹1,000.00.", HttpStatus.BAD_REQUEST);
        }

        try {
            // Debit Payer
            payerWallet.setBalance(resultingBalance);
            walletRepository.save(payerWallet);

            // Credit Requestor
            requestorWallet.setBalance(requestorWallet.getBalance().add(p2pRequest.getAmount()));
            walletRepository.save(requestorWallet);

            // Set to ACCEPTED
            p2pRequest.setStatus(RequestStatus.ACCEPTED);
            p2pRequest = payFlowRequestRepository.save(p2pRequest);

            log.info("P2P request accepted: {} paid requested amount {} to {}.",
                    user.getUsername(), INR_FORMAT.format(p2pRequest.getAmount()), p2pRequest.getFromUser().getUsername());

            return mapToP2PResponse(p2pRequest);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.error("Concurrent conflict during accepting P2P request: {}", e.getMessage());
            throw new AppException("Concurrent update detected. Please try again.", HttpStatus.CONFLICT);
        }
    }

    @Override
    @Transactional
    public P2PResponse declineRequest(User user, String requestId) {
        PayFlowRequest p2pRequest = payFlowRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException("Payment request not found.", HttpStatus.NOT_FOUND));

        if (!p2pRequest.getToUser().getId().equals(user.getId())) {
            throw new AppException("You are not authorized to decline this payment request.", HttpStatus.FORBIDDEN);
        }

        if (p2pRequest.getStatus() != RequestStatus.PENDING) {
            throw new AppException("This request is already resolved.", HttpStatus.BAD_REQUEST);
        }

        p2pRequest.setStatus(RequestStatus.DECLINED);
        p2pRequest = payFlowRequestRepository.save(p2pRequest);

        log.info("P2P request declined: {} refused requested payment from {}.",
                user.getUsername(), p2pRequest.getFromUser().getUsername());

        return mapToP2PResponse(p2pRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<P2PResponse> getRequestsFeed(User user) {
        List<PayFlowRequest> requests = payFlowRequestRepository.findAllByUserId(user.getId());
        return requests.stream()
                .map(this::mapToP2PResponse)
                .collect(Collectors.toList());
    }

    @Override
    public String generateQrCodeString(User user) {
        return "neobank://payflow/pay?username=" + user.getUsername() + "&fullName=" + user.getFullName().replace(" ", "%20");
    }

    // ─── Mapper Helpers ───────────────────────────────────────────

    private WalletDto mapToDto(Wallet wallet) {
        return WalletDto.builder()
                .id(wallet.getId())
                .username(wallet.getUser().getUsername())
                .ownerName(wallet.getUser().getFullName())
                .balance(wallet.getBalance())
                .formattedBalance(INR_FORMAT.format(wallet.getBalance()))
                .currency(wallet.getCurrency())
                .active(wallet.isActive())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private P2PResponse mapToP2PResponse(PayFlowRequest request) {
        return P2PResponse.builder()
                .id(request.getId())
                .fromUsername(request.getFromUser().getUsername())
                .fromFullName(request.getFromUser().getFullName())
                .toUsername(request.getToUser().getUsername())
                .toFullName(request.getToUser().getFullName())
                .amount(request.getAmount())
                .formattedAmount(INR_FORMAT.format(request.getAmount()))
                .status(request.getStatus().name())
                .note(request.getNote())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
