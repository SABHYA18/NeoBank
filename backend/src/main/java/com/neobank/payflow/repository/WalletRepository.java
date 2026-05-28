package com.neobank.payflow.repository;

import com.neobank.payflow.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, String> {

    Optional<Wallet> findByUserId(String userId);

    Optional<Wallet> findByUserUsername(String username);
}
