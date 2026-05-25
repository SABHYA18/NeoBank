package com.neobank.auth.service.impl;

import com.neobank.auth.model.RefreshToken;
import com.neobank.auth.model.User;
import com.neobank.auth.repository.RefreshTokenRepository;
import com.neobank.auth.service.RefreshTokenService;
import com.neobank.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Implementation of {@link RefreshTokenService}.
 * Manages refresh token creation, validation, and rotation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke all previous tokens for this user (token rotation)
        refreshTokenRepository.revokeAllUserTokens(user);

        RefreshToken token = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .revoked(false)
                .build();

        log.debug("Issued new refresh token for user: {}", user.getEmail());
        return refreshTokenRepository.save(token);
    }

    @Override
    public RefreshToken verifyRefreshToken(String tokenStr) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new AppException("Invalid refresh token.", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked()) {
            throw new AppException("Refresh token has been revoked. Please login again.", HttpStatus.UNAUTHORIZED);
        }

        if (token.isExpired()) {
            throw new AppException("Refresh token has expired. Please login again.", HttpStatus.UNAUTHORIZED);
        }

        return token;
    }
}
