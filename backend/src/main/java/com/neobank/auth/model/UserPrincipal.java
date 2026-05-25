package com.neobank.auth.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Security UserDetails wrapper for {@link User}.
 *
 * Separating this from the User entity avoids the Lombok/UserDetails conflict
 * where Lombok would generate getUsername() for the 'username' field, clashing
 * with UserDetails.getUsername() which must return the login identifier (email).
 */
@RequiredArgsConstructor
@Getter
public class UserPrincipal implements UserDetails {

    private final User user;

    // Spring Security uses this as the login identifier
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.isActive();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.isActive();
    }

    // Convenience helpers
    public String getId() {
        return user.getId();
    }

    public String getDisplayUsername() {
        return user.getUsername();
    }
}
