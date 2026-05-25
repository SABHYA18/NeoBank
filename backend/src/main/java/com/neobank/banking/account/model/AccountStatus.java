package com.neobank.banking.account.model;

/**
 * Lifecycle status of a NeoBank account.
 */
public enum AccountStatus {
    ACTIVE,     // Fully operational
    SUSPENDED,  // Temporarily blocked (e.g. fraud investigation)
    CLOSED      // Permanently closed
}
