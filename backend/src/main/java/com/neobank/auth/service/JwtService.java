package com.neobank.auth.service;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

/**
 * Contract for JWT token operations.
 * Implementation: {@link impl.JwtServiceImpl}
 */
public interface JwtService {

    /**
     * Generates a short-lived access token for the given user.
     */
    String generateAccessToken(UserDetails userDetails);

    /**
     * Generates a token with custom claims and a specific expiry duration.
     */
    String generateToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiryMs);

    /**
     * Validates a token against the provided UserDetails.
     * Returns true only if the token is not expired and the subject matches.
     */
    boolean isTokenValid(String token, UserDetails userDetails);

    /**
     * Extracts the username (subject) claim from the token.
     */
    String extractUsername(String token);
}
