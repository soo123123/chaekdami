package com.chaekdami.user.presentation;

import com.chaekdami.user.application.UserService;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.presentation.dto.ChangePasswordRequest;
import com.chaekdami.user.presentation.dto.LoginResponse;
import com.chaekdami.user.presentation.dto.RefreshTokenRequest;
import com.chaekdami.user.presentation.dto.SignUpRequest;
import com.chaekdami.user.presentation.dto.UserResponse;
import com.chaekdami.user.presentation.dto.LoginRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/api/auth/signup")
    public ResponseEntity<UserResponse> signup(@RequestBody @Valid SignUpRequest request) {
        UserResponse response = userService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody @Valid RefreshTokenRequest request) {
        return ResponseEntity.ok(userService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Void> logout(@RequestBody @Valid RefreshTokenRequest request) {
        userService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal Long userId,
                                               @RequestBody @Valid ChangePasswordRequest request) {
        if (userId == null) {
            throw new UnauthorizedException();
        }
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/api/auth/me", "/api/me"})
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }
        return ResponseEntity.ok(userService.getMe(userId));
    }
}