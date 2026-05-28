package com.neobank.payflow.controller;

import com.neobank.auth.model.UserPrincipal;
import com.neobank.payflow.dto.*;
import com.neobank.payflow.service.WalletService;
import com.neobank.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payflow")
@RequiredArgsConstructor
@Tag(name = "💸 PayFlow", description = "Core Wallet and instant P2P transfers ecosystem")
@SecurityRequirement(name = "bearerAuth")
public class PayFlowController {

    private final WalletService walletService;

    @GetMapping("/wallet")
    @Operation(summary = "Get wallet details for the authenticated user", description = "Returns balance, status, currency, and linked account")
    public ResponseEntity<ApiResponse<WalletDto>> getWalletDetails(@AuthenticationPrincipal UserPrincipal principal) {
        WalletDto response = walletService.getWalletDetails(principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Wallet details retrieved successfully.", response));
    }

    @PostMapping("/wallet/initialize")
    @Operation(summary = "Initialize and activate user wallet", description = "Links a bank account and does an initial deposit of at least 1k")
    public ResponseEntity<ApiResponse<WalletDto>> initializeWallet(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String accountId,
            @RequestParam BigDecimal initialAmount
    ) {
        WalletDto response = walletService.initializeWallet(principal.getUser(), accountId, initialAmount);
        return ResponseEntity.ok(ApiResponse.success("Wallet initialized and activated successfully.", response));
    }

    @PostMapping("/wallet/recharge")
    @Operation(summary = "Recharge wallet balance from the linked account", description = "Pulls money directly from the connected immutable account")
    public ResponseEntity<ApiResponse<WalletDto>> rechargeWallet(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam BigDecimal amount
    ) {
        WalletDto response = walletService.rechargeWallet(principal.getUser(), amount);
        return ResponseEntity.ok(ApiResponse.success("Wallet recharged successfully.", response));
    }

    @PostMapping("/send")
    @Operation(summary = "Instant P2P money transfer", description = "Debits sender wallet and credits recipient wallet, keeping sender balance above 1k")
    public ResponseEntity<ApiResponse<P2PResponse>> sendMoney(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMoneyRequest request
    ) {
        P2PResponse response = walletService.sendMoney(principal.getUser(), request);
        return ResponseEntity.ok(ApiResponse.success("Money sent successfully.", response));
    }

    @PostMapping("/request")
    @Operation(summary = "Create a P2P request", description = "Initiates a pending request for money from another registered user")
    public ResponseEntity<ApiResponse<P2PResponse>> requestMoney(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RequestMoneyRequest request
    ) {
        P2PResponse response = walletService.requestMoney(principal.getUser(), request);
        return ResponseEntity.ok(ApiResponse.success("Money requested successfully.", response));
    }

    @GetMapping("/requests")
    @Operation(summary = "Get P2P activity feed", description = "Lists all sent/received, pending, and accepted requests")
    public ResponseEntity<ApiResponse<List<P2PResponse>>> getRequestsFeed(@AuthenticationPrincipal UserPrincipal principal) {
        List<P2PResponse> response = walletService.getRequestsFeed(principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Requests feed retrieved successfully.", response));
    }

    @PostMapping("/requests/{id}/accept")
    @Operation(summary = "Approve a pending request", description = "Accepts the request and atomically transfers wallet funds")
    public ResponseEntity<ApiResponse<P2PResponse>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id
    ) {
        P2PResponse response = walletService.acceptRequest(principal.getUser(), id);
        return ResponseEntity.ok(ApiResponse.success("Payment request accepted successfully.", response));
    }

    @PostMapping("/requests/{id}/decline")
    @Operation(summary = "Decline a pending request", description = "Cancels/refuses the incoming payment request")
    public ResponseEntity<ApiResponse<P2PResponse>> declineRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id
    ) {
        P2PResponse response = walletService.declineRequest(principal.getUser(), id);
        return ResponseEntity.ok(ApiResponse.success("Payment request declined successfully.", response));
    }

    @GetMapping("/qrcode")
    @Operation(summary = "Get QR Payload representation", description = "Returns the custom QR payload URI")
    public ResponseEntity<ApiResponse<Map<String, String>>> getQrCodeString(@AuthenticationPrincipal UserPrincipal principal) {
        String qrString = walletService.generateQrCodeString(principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("QR Code payload generated.", Map.of("qrPayload", qrString)));
    }
}
