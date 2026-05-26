package com.neobank.banking.transaction.repository;

import com.neobank.banking.transaction.model.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, String> {

    Page<LedgerEntry> findByAccountId(String accountId, Pageable pageable);

    List<LedgerEntry> findByTransactionId(String transactionId);
}
