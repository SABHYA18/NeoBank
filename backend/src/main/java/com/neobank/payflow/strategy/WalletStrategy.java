package com.neobank.payflow.strategy;

import com.neobank.payflow.dto.WalletPaymentRequest;
import com.neobank.payflow.model.PaymentType;

public interface WalletStrategy {

    PaymentType supportedType();

    void validate(WalletPaymentRequest request);

    String execute(WalletPaymentRequest request);
}
