package com.neobank.auth.service;

import com.neobank.auth.model.RefreshToken;
import com.neobank.auth.model.User;
import com.neobank.auth.repository.RefreshTokenRepository;
import com.neobank.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Manages refresh token lifecycle: creation, validation, and rotation.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    /**
     * Creates a new refresh token for the user.
     * Revokes all existing tokens first (token rotation).
     */
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke all previous tokens for this user
        refreshTokenRepository.revokeAllUserTokens(user);

        RefreshToken token = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(token);
    }

    /**
     * Verifies that a refresh token is valid, not revoked, and not expired.
     */
    public RefreshToken verifyRefreshToken(String tokenStr) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new AppException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked()) {
            throw new AppException("Refresh token has been revoked. Please login again.", HttpStatus.UNAUTHORIZED);
        }

        if (token.isExpired()) {
            throw new AppException("Refresh token has expired. Please login again.", HttpStatus.UNAUTHORIZED);
        }

        return token;
    }
}
