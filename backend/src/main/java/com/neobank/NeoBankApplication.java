package com.neobank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * NeoBank Super-App Entry Point
 * Modules: Core Banking | PayFlow (P2P) | ClearLedger (Expenses)
 */
@SpringBootApplication
@EnableScheduling
public class NeoBankApplication {

    public static void main(String[] args) {
        SpringApplication.run(NeoBankApplication.class, args);
    }
}
