package com.neobank.auth.service;

import com.neobank.auth.model.RefreshToken;
import com.neobank.auth.model.User;

/**
 * Contract for refresh token lifecycle management.
 * Implementation: {@link impl.RefreshTokenServiceImpl}
 */
public interface RefreshTokenService {

    /**
     * Creates a new refresh token for the given user.
     * All existing tokens for this user are revoked first (token rotation).
     */
    RefreshToken createRefreshToken(User user);

    /**
     * Verifies a refresh token string — checks existence, revocation, and expiry.
     * Throws {@link com.neobank.common.exception.AppException} if invalid.
     */
    RefreshToken verifyRefreshToken(String token);
}
