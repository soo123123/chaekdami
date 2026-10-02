package com.chaekdami.user.presentation;

import com.chaekdami.user.application.UserService;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.presentation.dto.LoginResponse;
import com.chaekdami.user.presentation.dto.SignUpRequest;
import com.chaekdami.user.presentation.dto.UserResponse;
import com.chaekdami.user.presentation.dto.LoginRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
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

    @GetMapping({"/api/auth/me", "/api/me"})
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal String email) {
        if (!StringUtils.hasText(email)) {
            throw new UnauthorizedException();
        }
        return ResponseEntity.ok(userService.getMe(email));
    }
}