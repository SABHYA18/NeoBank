package com.neobank.payflow.strategy;

import com.neobank.common.exception.AppException;
import com.neobank.payflow.dto.WalletPaymentRequest;
import com.neobank.payflow.model.PaymentType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class WalletStrategyFactory {

    private final Map<PaymentType, WalletStrategy> strategies;

    public WalletStrategyFactory(List<WalletStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(WalletStrategy::supportedType, Function.identity()));
    }

    public WalletStrategy resolve(PaymentType type) {
        WalletStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new AppException("Unsupported wallet payment type: " + type, HttpStatus.BAD_REQUEST);
        }
        return strategy;
    }
}
