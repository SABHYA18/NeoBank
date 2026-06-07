package com.neobank.payflow.service;

import com.neobank.auth.model.User;
import com.neobank.payflow.dto.*;
import com.neobank.payflow.model.Wallet;

import java.math.BigDecimal;
import java.util.List;

public interface WalletService {

    WalletDto getWalletDetails(User user);

    WalletDto initializeWallet(User user, String accountId, BigDecimal initialAmount);

    WalletDto rechargeWallet(User user, BigDecimal amount);

    P2PResponse sendMoney(User user, SendMoneyRequest request);

    P2PResponse requestMoney(User user, RequestMoneyRequest request);

    P2PResponse acceptRequest(User user, String requestId);

    P2PResponse declineRequest(User user, String requestId);

    List<P2PResponse> getRequestsFeed(User user);

    String generateQrCodeString(User user);

    WalletPaymentResponse payWithStrategy(User user, WalletPaymentRequest request);

    List<WalletPaymentResponse> getPaymentHistory(User user);
}
