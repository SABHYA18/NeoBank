package com.neobank.user.controller;

import com.neobank.auth.model.User;
import com.neobank.auth.model.UserPrincipal;
import com.neobank.common.dto.ApiResponse;
import com.neobank.user.dto.UserProfileDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * User profile endpoints — requires authentication.
 * GET /api/v1/users/me — returns the current user's profile
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "👤 Users", description = "User profile and settings")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    @GetMapping("/me")
    @Operation(summary = "Get current user's profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();

        UserProfileDto profile = UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .active(user.isActive())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Profile retrieved.", profile));
    }
}
