package com.neobank.auth.service;

import com.neobank.auth.dto.AuthResponse;
import com.neobank.auth.dto.LoginRequest;
import com.neobank.auth.dto.SignupRequest;

/**
 * Contract for authentication operations.
 * Implementation: {@link impl.AuthServiceImpl}
 */
public interface AuthService {

    /**
     * Registers a new customer account, returns JWT tokens.
     */
    AuthResponse signup(SignupRequest request);

    /**
     * Authenticates a user by email + password, returns JWT tokens.
     */
    AuthResponse login(LoginRequest request);

    /**
     * Exchanges a valid refresh token for a new access + refresh token pair.
     */
    AuthResponse refreshToken(String refreshToken);
}
