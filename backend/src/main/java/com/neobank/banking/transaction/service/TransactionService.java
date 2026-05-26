package com.neobank.banking.transaction.service;

import com.neobank.banking.transaction.dto.DepositRequest;
import com.neobank.banking.transaction.dto.TransactionResponse;
import com.neobank.banking.transaction.dto.TransferRequest;
import com.neobank.banking.transaction.dto.WithdrawRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TransactionService {

    TransactionResponse deposit(DepositRequest request);

    TransactionResponse withdraw(WithdrawRequest request);

    TransactionResponse transfer(TransferRequest request);

    Page<TransactionResponse> getMyTransactionHistory(Pageable pageable);
}
