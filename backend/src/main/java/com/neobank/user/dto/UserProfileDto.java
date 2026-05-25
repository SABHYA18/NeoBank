package com.neobank.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO returned by GET /api/v1/users/me
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileDto {
    private String id;
    private String email;
    private String username;
    private String fullName;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
    private boolean active;
}
