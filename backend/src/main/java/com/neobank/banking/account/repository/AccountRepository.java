package com.neobank.banking.account.repository;

import com.neobank.banking.account.model.Account;
import com.neobank.banking.account.model.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    // Find all accounts belonging to a user
    List<Account> findByUserId(String userId);

    // Find accounts by user and status (e.g. only ACTIVE accounts)
    List<Account> findByUserIdAndStatus(String userId, AccountStatus status);

    Optional<Account> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);
}
