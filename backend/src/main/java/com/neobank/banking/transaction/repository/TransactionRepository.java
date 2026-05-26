package com.neobank.banking.transaction.repository;

import com.neobank.banking.transaction.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(t.fromAccount IS NOT NULL AND t.fromAccount.user.id = :userId) OR " +
           "(t.toAccount IS NOT NULL AND t.toAccount.user.id = :userId)")
    Page<Transaction> findAllByUserId(@Param("userId") String userId, Pageable pageable);
}
