package com.neobank.payflow.strategy;

import com.neobank.common.exception.AppException;
import com.neobank.payflow.dto.WalletPaymentRequest;
import com.neobank.payflow.model.PaymentType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class BookingWalletStrategy implements WalletStrategy {

    @Override
    public PaymentType supportedType() {
        return PaymentType.BOOKING;
    }

    @Override
    public void validate(WalletPaymentRequest request) {
        Map<String, String> meta = request.getMetadata();
        if (meta == null || isBlank(meta.get("provider")) || isBlank(meta.get("bookingRef"))) {
            throw new AppException("Booking payments require metadata: provider, bookingRef", HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    public String execute(WalletPaymentRequest request) {
        validate(request);
        return "BK-" + request.getMetadata().get("provider").toUpperCase() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
