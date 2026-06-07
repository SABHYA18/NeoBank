package com.neobank.payflow.repository;

import com.neobank.payflow.model.PayFlowPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayFlowPaymentRepository extends JpaRepository<PayFlowPayment, String> {
    List<PayFlowPayment> findByUserIdOrderByCreatedAtDesc(String userId);
}
