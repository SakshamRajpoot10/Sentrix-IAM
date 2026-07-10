package com.sentrix.security;

import com.sentrix.entity.AdminUser;
import com.sentrix.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AdminUser adminUser = adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return new User(
                adminUser.getEmail(),
                adminUser.getPasswordHash(),
                !adminUser.isAccountLocked(),   // enabled
                true,                            // accountNonExpired
                true,                            // credentialsNonExpired
                !adminUser.isAccountLocked(),    // accountNonLocked
                List.of(new SimpleGrantedAuthority("ROLE_" + adminUser.getRole().name()))
        );
    }
}
