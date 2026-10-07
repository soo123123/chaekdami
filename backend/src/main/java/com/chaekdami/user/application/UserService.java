package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.exception.DuplicateEmailException;
import com.chaekdami.user.application.exception.DuplicateNicknameException;
import com.chaekdami.user.application.exception.InvalidCredentialsException;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.domain.RefreshToken;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import com.chaekdami.user.presentation.dto.ChangePasswordRequest;
import com.chaekdami.user.presentation.dto.LoginResponse;
import com.chaekdami.user.presentation.dto.SignUpRequest;
import com.chaekdami.user.presentation.dto.UserResponse;
import com.chaekdami.user.presentation.dto.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private static final String DUMMY_PASSWORD_HASH = new BCryptPasswordEncoder().encode("timing-safe-dummy");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-token-validity-in-seconds:7776000}")
    private long refreshTokenValidityInSeconds;

    @Transactional
    public UserResponse signup(SignUpRequest request) {
        String email = normalizeEmail(request.getEmail());
        String nickname = request.getNickname().trim();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new DuplicateEmailException();
        }
        if (userRepository.existsByNicknameIgnoreCase(nickname)) {
            throw new DuplicateNicknameException();
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .nickname(nickname)
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);
        return new UserResponse(savedUser);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            passwordEncoder.matches(request.getPassword(), DUMMY_PASSWORD_HASH);
            throw new InvalidCredentialsException();
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return issueTokens(user);
    }

    @Transactional(noRollbackFor = UnauthorizedException.class)
    public LoginResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(sha256(rawRefreshToken))
                .orElseThrow(UnauthorizedException::new);
        if (stored.isRevoked()) {
            revokeAll(stored.getUser().getId());
            throw new UnauthorizedException();
        }
        if (stored.isExpired(LocalDateTime.now())) {
            throw new UnauthorizedException();
        }

        stored.revoke(LocalDateTime.now());
        return issueTokens(stored.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenRepository.findByTokenHash(sha256(rawRefreshToken))
                .ifPresent(token -> token.revoke(LocalDateTime.now()));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId).orElseThrow(UnauthorizedException::new);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("currentPassword", "현재 비밀번호가 올바르지 않습니다.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("newPassword", "새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }
        rejectIdentityPassword(user, request.getNewPassword());

        user.changePassword(passwordEncoder.encode(request.getNewPassword()));
        revokeAll(user.getId());
    }

    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(UnauthorizedException::new);
        return new UserResponse(user);
    }

    private LoginResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole().name());
        String refreshToken = newRefreshToken(user);
        return LoginResponse.bearer(accessToken, refreshToken);
    }

    private String newRefreshToken(User user) {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenValidityInSeconds);
        refreshTokenRepository.save(new RefreshToken(user, sha256(rawToken), expiresAt));
        return rawToken;
    }

    private void revokeAll(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        for (RefreshToken token : refreshTokenRepository.findAllByUser_IdAndRevokedAtIsNull(userId)) {
            token.revoke(now);
        }
    }

    private static void rejectIdentityPassword(User user, String password) {
        int at = user.getEmail().indexOf('@');
        if (at > 0 && password.equalsIgnoreCase(user.getEmail().substring(0, at))) {
            throw new InvalidRequestException("newPassword", "비밀번호는 이메일 아이디와 같을 수 없습니다.");
        }
        if (password.equalsIgnoreCase(user.getNickname())) {
            throw new InvalidRequestException("newPassword", "비밀번호는 닉네임과 같을 수 없습니다.");
        }
    }

    private static String sha256(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}