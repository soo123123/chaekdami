package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.ChangePasswordCommand;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.command.PasswordResetCommand;
import com.chaekdami.user.application.command.PasswordResetRequestCommand;
import com.chaekdami.user.application.command.SignupCommand;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import com.chaekdami.user.application.exception.AccountSuspendedException;
import com.chaekdami.user.application.exception.DuplicateEmailException;
import com.chaekdami.user.application.exception.DuplicateNicknameException;
import com.chaekdami.user.application.exception.InvalidCredentialsException;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.application.result.IssuedTokens;
import com.chaekdami.user.application.result.UserAccount;
import com.chaekdami.user.domain.PasswordResetToken;
import com.chaekdami.user.domain.RefreshToken;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.LoginCredential;
import com.chaekdami.user.infrastructure.PasswordResetTokenRepository;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import com.chaekdami.user.presentation.validation.NicknameRules;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionOperations;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private static final String DUMMY_PASSWORD_HASH = new BCryptPasswordEncoder().encode("timing-safe-dummy");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final long PASSWORD_RESET_TOKEN_MINUTES = 15;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordResetNotifier passwordResetNotifier;
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final CurrentUser currentUser;
    private final AccessGuard accessGuard;
    private final ApplicationEventPublisher eventPublisher;
    private final TransactionOperations transaction;

    @Value("${jwt.refresh-token-validity-in-seconds:7776000}")
    private long refreshTokenValidityInSeconds;

    /**
     * 비밀번호 해시(BCrypt)는 트랜잭션 밖에서 만든다.
     * 동시에 가입해 저장에 실패하면 어느 값이 겹쳤는지 다시 조회해 구분한다.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public UserAccount signup(SignupCommand command) {
        String email = normalizeEmail(command.email());
        String nickname = command.nickname().trim();
        transaction.executeWithoutResult(status -> rejectDuplicate(email, nickname));

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(command.password()))
                .nickname(nickname)
                .role(Role.USER)
                .build();

        try {
            return transaction.execute(status -> UserAccount.from(userRepository.save(user)));
        } catch (DataIntegrityViolationException exception) {
            transaction.executeWithoutResult(status -> rejectDuplicate(email, nickname));
            throw exception;
        }
    }

    private void rejectDuplicate(String email, String nickname) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new DuplicateEmailException();
        }
        if (userRepository.existsByNicknameIgnoreCase(nickname)) {
            throw new DuplicateNicknameException();
        }
    }

    /**
     * DB 연결을 한 번에 하나만 쓰도록 조회·실패 기록·토큰 발급을 겹치지 않게 실행한다.
     * 비밀번호 비교(BCrypt)는 트랜잭션 밖에서 한다.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public IssuedTokens login(LoginCommand command) {
        String email = normalizeEmail(command.email());
        String clientIp = command.clientIp();
        loginAttemptLimiter.checkLoginAllowed(email, clientIp);

        LoginCredential credential = transaction.execute(
                status -> userRepository.findLoginCredential(email).orElse(null));
        if (credential == null) {
            passwordEncoder.matches(command.password(), DUMMY_PASSWORD_HASH);
            throw rejectLogin(email, clientIp);
        }
        if (!passwordEncoder.matches(command.password(), credential.passwordHash())) {
            throw rejectLogin(email, clientIp);
        }

        loginAttemptLimiter.clearLoginFailures(email, clientIp);
        return transaction.execute(status -> issueLoginTokens(credential));
    }

    /**
     * 비밀번호를 비교하는 동안 비밀번호 변경·탈퇴·정지가 있었을 수 있어 회원을 잠그고 다시 확인한다.
     * 비밀번호가 맞을 때만 정지 사실을 알린다.
     */
    private IssuedTokens issueLoginTokens(LoginCredential credential) {
        User user = userRepository.findByIdForUpdate(credential.id())
                .filter(found -> found.getPasswordHash().equals(credential.passwordHash()))
                .orElseThrow(InvalidCredentialsException::new);
        if (user.isSuspendedAt(LocalDateTime.now())) {
            throw new AccountSuspendedException(user.getSuspendedUntil());
        }
        return issueTokens(user);
    }

    /**
     * 폐기 표시가 남은 토큰은 재발급으로 교체된 것뿐이다. 다시 오면 도난으로 보고 모두 무효화한다.
     * 로그아웃·일괄 무효화된 토큰은 지워지므로 401만 낸다.
     */
    @Transactional(noRollbackFor = UnauthorizedException.class)
    public IssuedTokens refresh(String rawRefreshToken) {
        String tokenHash = sha256(rawRefreshToken);
        // 잠근 뒤에 토큰을 읽어야 기다리는 동안 지워진 토큰을 알 수 있다.
        lockOwner(tokenHash).orElseThrow(UnauthorizedException::new);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(UnauthorizedException::new);
        if (stored.isRevoked()) {
            // 예외를 던져도 버전 증가와 Refresh 삭제는 커밋된다.
            invalidateSessions(stored.getUser());
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
        String tokenHash = sha256(rawRefreshToken);
        if (lockOwner(tokenHash).isPresent()) {
            refreshTokenRepository.deleteUsableByTokenHash(tokenHash);
        }
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
        invalidateSessions(user);
    }

    @Transactional
    public void logoutAll() {
        invalidateSessions(loadCurrentUser());
    }

    /**
     * 이미 발급된 Access Token(버전 비교로 다음 요청부터 401)과 Refresh Token을 모두 못 쓰게 한다.
     * 전체 로그아웃, 비밀번호 변경·재설정, 재사용 감지, 관리자의 정지·역할 변경이 쓴다.
     */
    void invalidateSessions(User user) {
        user.bumpTokenVersion();
        // 먼저 잠가야 같은 때 재발급된 토큰까지 지운다.
        userRepository.findByIdForUpdate(user.getId());
        refreshTokenRepository.deleteAllOfUser(user.getId());
    }

    private Optional<User> lockOwner(String tokenHash) {
        return refreshTokenRepository.findUserIdByTokenHash(tokenHash)
                .flatMap(userRepository::findByIdForUpdate);
    }

    public UserAccount getMe() {
        return UserAccount.from(loadCurrentUser());
    }

    /** 비밀번호 비교(BCrypt)는 트랜잭션 밖에서 해 DB 연결을 쥐지 않는다. */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public UserAccount changeNickname(String nickname) {
        Long userId = currentUser.requireId();
        String violation = NicknameRules.violationMessage(nickname);
        if (nickname == null || violation != null) {
            throw new InvalidRequestException("nickname",
                    violation != null ? violation : "닉네임을 입력해야 합니다.");
        }
        String normalized = nickname.trim();
        LoginCredential credential = transaction.execute(
                status -> userRepository.findCredentialById(userId).orElseThrow(UnauthorizedException::new));
        if (passwordEncoder.matches(normalized, credential.passwordHash())) {
            throw new InvalidRequestException("nickname", "닉네임은 비밀번호와 같을 수 없습니다.");
        }
        try {
            return transaction.execute(status -> saveNickname(credential, normalized));
        } catch (DataIntegrityViolationException exception) {
            // 중복 검사를 함께 통과한 요청이 먼저 저장했다. 이 트랜잭션은 닉네임만 바꾼다.
            throw new DuplicateNicknameException();
        }
    }

    /** 비교하는 동안 비밀번호 변경·탈퇴·정지가 있었을 수 있어 회원을 잠그고 다시 확인한다. */
    private UserAccount saveNickname(LoginCredential credential, String nickname) {
        User user = userRepository.findByIdForUpdate(credential.id())
                .filter(found -> found.getPasswordHash().equals(credential.passwordHash()))
                .filter(found -> !found.isSuspendedAt(LocalDateTime.now()))
                .orElseThrow(UnauthorizedException::new);
        if (!nickname.equalsIgnoreCase(user.getNickname())
                && userRepository.existsByNicknameIgnoreCase(nickname)) {
            throw new DuplicateNicknameException();
        }
        user.changeNickname(nickname);
        return UserAccount.from(user);
    }

    @Transactional
    public void withdraw(String currentPassword) {
        User user = loadCurrentUser();
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new InvalidRequestException("currentPassword", "현재 비밀번호가 올바르지 않습니다.");
        }
        // 재발급(회원 → 토큰 순으로 잠금)과 순서를 맞춘다.
        userRepository.findByIdForUpdate(user.getId());
        // 리스너가 같은 트랜잭션에서 다른 도메인의 사용자 데이터를 먼저 지운다.
        eventPublisher.publishEvent(new UserWithdrawnEvent(user.getId()));
        refreshTokenRepository.deleteAllOfUser(user.getId());
        passwordResetTokenRepository.deleteByUser_Id(user.getId());
        loginAttemptLimiter.deleteAllOf(user.getEmail());
        userRepository.delete(user);
    }

    /**
     * 메일을 보내는 동안 DB 연결을 쥐지 않는다. 메일 발송에 실패하면 새 토큰만 지우고 이전 링크는 그대로 둔다.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void requestPasswordReset(PasswordResetRequestCommand command) {
        String email = normalizeEmail(command.email());
        loginAttemptLimiter.consumePasswordResetRequest(email, command.clientIp());

        String rawToken = newRawToken();
        String tokenHash = sha256(rawToken);
        IssuedReset issued = transaction.execute(status -> saveResetToken(email, tokenHash));
        if (issued == null) {
            return;
        }

        try {
            passwordResetNotifier.send(issued.email(), rawToken);
        } catch (RuntimeException exception) {
            discardResetToken(issued.tokenId(), exception);
            throw exception;
        }
        transaction.executeWithoutResult(status -> invalidateOlderResetTokens(issued));
    }

    private IssuedReset saveResetToken(String email, String tokenHash) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return null;
        }
        PasswordResetToken saved = passwordResetTokenRepository.save(new PasswordResetToken(
                user, tokenHash, LocalDateTime.now().plusMinutes(PASSWORD_RESET_TOKEN_MINUTES)));
        return new IssuedReset(user.getId(), user.getEmail(), saved.getId());
    }

    private void discardResetToken(Long tokenId, RuntimeException mailFailure) {
        try {
            transaction.executeWithoutResult(status -> passwordResetTokenRepository.deleteById(tokenId));
        } catch (RuntimeException exception) {
            mailFailure.addSuppressed(exception);
        }
    }

    /** 동시에 요청해도 서로를 무효화하지 않도록 먼저 만든 토큰만 무효화한다. */
    private void invalidateOlderResetTokens(IssuedReset issued) {
        LocalDateTime now = LocalDateTime.now();
        for (PasswordResetToken token : passwordResetTokenRepository
                .findAllByUser_IdAndUsedAtIsNullAndIdLessThan(issued.userId(), issued.tokenId())) {
            token.use(now);
        }
    }

    private record IssuedReset(Long userId, String email, Long tokenId) {
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
        invalidateSessions(user);
        stored.use(LocalDateTime.now());
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
