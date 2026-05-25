package com.neobank.banking.account.model;

import com.neobank.auth.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Bank account entity.
 *
 * Key design decisions:
 * - Balance stored as BigDecimal (no floating-point rounding errors)
 * - @Version enables optimistic locking to prevent concurrent transfer conflicts
 * - Currency defaults to INR
 * - Account number is auto-generated and unique
 */
@Entity
@Table(name = "accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(unique = true, nullable = false)
    private String accountNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;

    // Using BigDecimal for precise financial calculations — never use double/float for money
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "INR";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Optimistic locking — prevents race conditions during concurrent transfers
    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
