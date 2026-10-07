package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.ChangePasswordCommand;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.command.PasswordResetCommand;
import com.chaekdami.user.application.command.PasswordResetRequestCommand;
import com.chaekdami.user.application.command.SignupCommand;
import com.chaekdami.user.application.command.EmailVerificationRequestCommand;
import com.chaekdami.user.application.exception.EmailNotVerifiedException;
import com.chaekdami.user.application.exception.DuplicateEmailException;
import com.chaekdami.user.application.exception.DuplicateNicknameException;
import com.chaekdami.user.application.exception.InvalidCredentialsException;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.application.result.IssuedTokens;
import com.chaekdami.user.application.result.UserAccount;
import com.chaekdami.user.domain.EmailVerificationToken;
import com.chaekdami.user.domain.PasswordResetToken;
import com.chaekdami.user.domain.RefreshToken;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.EmailVerificationTokenRepository;
import com.chaekdami.user.infrastructure.PasswordResetTokenRepository;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
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
    private static final long PASSWORD_RESET_TOKEN_MINUTES = 15;
    private static final long EMAIL_VERIFICATION_TOKEN_HOURS = 24;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordResetNotifier passwordResetNotifier;
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final CurrentUser currentUser;
    private final AccessGuard accessGuard;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailVerificationNotifier emailVerificationNotifier;

    @Value("${jwt.refresh-token-validity-in-seconds:7776000}")
    private long refreshTokenValidityInSeconds;

    @Transactional
    public UserAccount signup(SignupCommand command) {
        String email = normalizeEmail(command.email());
        String nickname = command.nickname().trim();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new DuplicateEmailException();
        }
        if (userRepository.existsByNicknameIgnoreCase(nickname)) {
            throw new DuplicateNicknameException();
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(command.password()))
                .nickname(nickname)
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);
        sendEmailVerification(savedUser);
        return UserAccount.from(savedUser);
    }

    @Transactional
    public IssuedTokens login(LoginCommand command) {
        String email = normalizeEmail(command.email());
        String clientIp = command.clientIp();
        loginAttemptLimiter.checkLoginAllowed(email, clientIp);

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            passwordEncoder.matches(command.password(), DUMMY_PASSWORD_HASH);
            throw rejectLogin(email, clientIp);
        }
        if (!passwordEncoder.matches(command.password(), user.getPasswordHash())) {
            throw rejectLogin(email, clientIp);
        }

        loginAttemptLimiter.clearLoginFailures(email, clientIp);
        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }
        return issueTokens(user);
    }

    @Transactional(noRollbackFor = UnauthorizedException.class)
    public IssuedTokens refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(sha256(rawRefreshToken))
                .orElseThrow(UnauthorizedException::new);
        if (stored.isRevoked()) {
            // 예외를 던져도 버전 증가와 Refresh 폐기는 커밋된다.
            User user = stored.getUser();
            user.bumpTokenVersion();
            revokeAll(user.getId());
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
    public void changePassword(ChangePasswordCommand command) {
        User user = loadCurrentUser();
        if (!passwordEncoder.matches(command.currentPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("currentPassword", "현재 비밀번호가 올바르지 않습니다.");
        }
        if (passwordEncoder.matches(command.newPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("newPassword", "새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }
        rejectIdentityPassword(user, command.newPassword(), "newPassword");

        user.changePassword(passwordEncoder.encode(command.newPassword()));
        user.bumpTokenVersion();
        revokeAll(user.getId());
    }

    @Transactional
    public void logoutAll() {
        User user = loadCurrentUser();
        user.bumpTokenVersion();
        revokeAll(user.getId());
    }

    public UserAccount getMe() {
        return UserAccount.from(loadCurrentUser());
    }

    @Transactional
    public void requestPasswordReset(PasswordResetRequestCommand command) {
        String email = normalizeEmail(command.email());
        loginAttemptLimiter.consumePasswordResetRequest(email, command.clientIp());

        String rawToken = newRawToken();
        String tokenHash = sha256(rawToken);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (PasswordResetToken previous : passwordResetTokenRepository.findAllByUser_IdAndUsedAtIsNull(user.getId())) {
            previous.use(now);
        }
        passwordResetTokenRepository.save(
                new PasswordResetToken(user, tokenHash, now.plusMinutes(PASSWORD_RESET_TOKEN_MINUTES)));
        passwordResetNotifier.send(user.getEmail(), rawToken);
    }

    @Transactional
    public void resetPassword(PasswordResetCommand command) {
        PasswordResetToken stored = passwordResetTokenRepository.findByTokenHash(sha256(command.token()))
                .orElseThrow(() -> new InvalidRequestException("token", "재설정 링크가 유효하지 않습니다."));
        if (stored.isUsed() || stored.isExpired(LocalDateTime.now())) {
            throw new InvalidRequestException("token", "재설정 링크가 유효하지 않습니다.");
        }

        User user = stored.getUser();
        if (passwordEncoder.matches(command.newPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("newPassword", "새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }
        rejectIdentityPassword(user, command.newPassword(), "newPassword");

        user.changePassword(passwordEncoder.encode(command.newPassword()));
        user.bumpTokenVersion();
        revokeAll(user.getId());
        stored.use(LocalDateTime.now());
    }

    @Transactional
    public void requestEmailVerification(EmailVerificationRequestCommand command) {
        String email = normalizeEmail(command.email());
        loginAttemptLimiter.consumeEmailVerificationRequest(email, command.clientIp());

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isEmailVerified()) {
            return;
        }
        sendEmailVerification(user);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        EmailVerificationToken stored = emailVerificationTokenRepository.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new InvalidRequestException("token", "인증 링크가 유효하지 않습니다."));
        if (stored.isUsed() || stored.isExpired(LocalDateTime.now())) {
            throw new InvalidRequestException("token", "인증 링크가 유효하지 않습니다.");
        }
        stored.getUser().verifyEmail();
        stored.use(LocalDateTime.now());
    }

    private void sendEmailVerification(User user) {
        LocalDateTime now = LocalDateTime.now();
        for (EmailVerificationToken previous : emailVerificationTokenRepository.findAllByUser_IdAndUsedAtIsNull(user.getId())) {
            previous.use(now);
        }
        String rawToken = newRawToken();
        emailVerificationTokenRepository.save(new EmailVerificationToken(
                user, sha256(rawToken), now.plusHours(EMAIL_VERIFICATION_TOKEN_HOURS)));
        emailVerificationNotifier.send(user.getEmail(), rawToken);
    }

    private User loadCurrentUser() {
        Long userId = currentUser.requireId();
        User user = userRepository.findById(userId).orElseThrow(UnauthorizedException::new);
        accessGuard.requireSelf(user.getId());
        return user;
    }

    private RuntimeException rejectLogin(String email, String clientIp) {
        loginAttemptLimiter.recordLoginFailure(email, clientIp);
        loginAttemptLimiter.checkLoginAllowed(email, clientIp);
        return new InvalidCredentialsException();
    }

    private IssuedTokens issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(
                user.getId(), user.getRole().name(), user.getTokenVersion());
        String refreshToken = newRefreshToken(user);
        return IssuedTokens.bearer(accessToken, refreshToken);
    }

    private String newRefreshToken(User user) {
        String rawToken = newRawToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenValidityInSeconds);
        refreshTokenRepository.save(new RefreshToken(user, sha256(rawToken), expiresAt));
        return rawToken;
    }

    private static String newRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void revokeAll(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        for (RefreshToken token : refreshTokenRepository.findAllByUser_IdAndRevokedAtIsNull(userId)) {
            token.revoke(now);
        }
    }

    private static void rejectIdentityPassword(User user, String password, String field) {
        int at = user.getEmail().indexOf('@');
        if (at > 0 && password.equalsIgnoreCase(user.getEmail().substring(0, at))) {
            throw new InvalidRequestException(field, "비밀번호는 이메일 아이디와 같을 수 없습니다.");
        }
        if (password.equalsIgnoreCase(user.getNickname())) {
            throw new InvalidRequestException(field, "비밀번호는 닉네임과 같을 수 없습니다.");
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
