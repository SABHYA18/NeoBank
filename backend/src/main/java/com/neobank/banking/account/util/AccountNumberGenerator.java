package com.neobank.banking.account.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Generates unique 10-digit bank account numbers.
 * Uses SecureRandom for better entropy than Math.random().
 * Ensures first digit is never 0 (real account number convention).
 */
@Component
public class AccountNumberGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Generates a random 10-digit account number (1000000000 – 9999999999).
     * Uniqueness is verified in the service layer before saving.
     */
    public String generate() {
        long number = 1_000_000_000L + (long) (SECURE_RANDOM.nextDouble() * 9_000_000_000L);
        return String.valueOf(number);
    }
}
