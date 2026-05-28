package com.neobank.payflow.repository;

import com.neobank.payflow.model.PayFlowRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayFlowRequestRepository extends JpaRepository<PayFlowRequest, String> {

    @Query("SELECT r FROM PayFlowRequest r WHERE r.fromUser.id = :userId OR r.toUser.id = :userId ORDER BY r.createdAt DESC")
    List<PayFlowRequest> findAllByUserId(@Param("userId") String userId);
}
