package com.neobank.auth.service;

import com.neobank.auth.dto.AuthResponse;
import com.neobank.auth.dto.LoginRequest;
import com.neobank.auth.dto.SignupRequest;
import com.neobank.auth.model.RefreshToken;
import com.neobank.auth.model.Role;
import com.neobank.auth.model.User;
import com.neobank.auth.model.UserPrincipal;
import com.neobank.auth.repository.UserRepository;
import com.neobank.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Core authentication service: handles signup, login, and token refresh.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    // ─── Signup ───────────────────────────────────────────────────

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // Duplicate checks
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("This email is already registered.", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("This username is already taken.", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new AppException("This phone number is already registered.", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .username(request.getUsername())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .active(true)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {} ({})", user.getUsername(), user.getEmail());

        return generateAuthResponse(user);
    }

    // ─── Login ────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        // Delegates to Spring Security — throws BadCredentialsException if invalid
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        log.info("User logged in: {}", user.getEmail());
        return generateAuthResponse(user);
    }

    // ─── Token Refresh ────────────────────────────────────────────

    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(refreshTokenStr);
        User user = refreshToken.getUser();
        return generateAuthResponse(user);
    }

    // ─── Internal Helpers ─────────────────────────────────────────

    private AuthResponse generateAuthResponse(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtService.generateAccessToken(principal);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .phone(user.getPhone())
                        .role(user.getRole().name())
                        .build())
                .build();
    }
}
