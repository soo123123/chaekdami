package com.chaekdami.user.presentation;

import com.chaekdami.user.application.UserService;
import com.chaekdami.user.application.command.ChangePasswordCommand;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.command.PasswordResetCommand;
import com.chaekdami.user.application.command.PasswordResetRequestCommand;
import com.chaekdami.user.application.command.SignupCommand;
import com.chaekdami.user.presentation.dto.ChangePasswordRequest;
import com.chaekdami.user.presentation.dto.LoginRequest;
import com.chaekdami.user.presentation.dto.LoginResponse;
import com.chaekdami.user.presentation.dto.PasswordResetEmailRequest;
import com.chaekdami.user.presentation.dto.RefreshTokenRequest;
import com.chaekdami.user.presentation.dto.ResetPasswordRequest;
import com.chaekdami.user.presentation.dto.SignUpRequest;
import com.chaekdami.user.presentation.dto.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/api/auth/signup")
    public ResponseEntity<UserResponse> signup(@RequestBody @Valid SignUpRequest request) {
        var account = userService.signup(new SignupCommand(
                request.getEmail(), request.getPassword(), request.getNickname()));
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(account));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request,
                                               HttpServletRequest httpRequest) {
        var tokens = userService.login(new LoginCommand(
                request.getEmail(), request.getPassword(), ClientAddress.from(httpRequest)));
        return ResponseEntity.ok(LoginResponse.from(tokens));
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody @Valid RefreshTokenRequest request) {
        return ResponseEntity.ok(LoginResponse.from(userService.refresh(request.getRefreshToken())));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Void> logout(@RequestBody @Valid RefreshTokenRequest request) {
        userService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/logout-all")
    public ResponseEntity<Void> logoutAll() {
        userService.logoutAll();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/password")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(new ChangePasswordCommand(
                request.getCurrentPassword(), request.getNewPassword()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/password/reset-request")
    public ResponseEntity<Void> requestPasswordReset(@RequestBody @Valid PasswordResetEmailRequest request,
                                                     HttpServletRequest httpRequest) {
        userService.requestPasswordReset(new PasswordResetRequestCommand(
                request.getEmail(), ClientAddress.from(httpRequest)));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/password/reset")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        userService.resetPassword(new PasswordResetCommand(request.getToken(), request.getNewPassword()));
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/api/auth/me", "/api/me"})
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(UserResponse.from(userService.getMe()));
    }
}
