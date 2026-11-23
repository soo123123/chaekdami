package com.chaekdami.user.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.application.result.AdminUserResult;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.domain.UserErrorCode;
import com.chaekdami.user.domain.UserStatus;
import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

/**
 * 관리자 회원 관리. /api/admin/** 는 SecurityConfig가 ADMIN만 통과시킨다.
 * 정지·역할 변경은 자기 자신과 ADMIN 회원에게 할 수 없다. 해제는 ADMIN에게도 할 수 있다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAdminService {

    public static final int MAX_PAGE_SIZE = 100;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

    private final UserRepository userRepository;
    private final UserService userService;
    private final CurrentUser currentUser;

    public PageResponse<AdminUserResult> search(String query, Role role, UserStatus status, int page, int size) {
        if (page < 0) {
            throw new InvalidRequestException("page", "page는 0 이상이어야 합니다.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new InvalidRequestException("size", "size는 1 이상 " + MAX_PAGE_SIZE + " 이하여야 합니다.");
        }
        LocalDateTime now = LocalDateTime.now();
        String keyword = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        Set<Role> roles = role == null ? EnumSet.allOf(Role.class) : EnumSet.of(role);
        boolean includeSuspended = status == null || status == UserStatus.SUSPENDED;
        boolean includeActive = status == null || status == UserStatus.ACTIVE;
        return PageResponse.from(
                userRepository.searchForAdmin(keyword, roles, includeSuspended, includeActive, now,
                        PageRequest.of(page, size, NEWEST_FIRST)),
                user -> AdminUserResult.summary(user, now));
    }

    public AdminUserResult get(Long userId) {
        return AdminUserResult.detail(requireUser(userId), LocalDateTime.now());
    }

    @Transactional
    public AdminUserResult suspend(Long userId, String reason, LocalDateTime until) {
        LocalDateTime now = LocalDateTime.now();
        if (until != null && !until.isAfter(now)) {
            throw new InvalidRequestException("until", "정지 끝 시각은 지금보다 뒤여야 합니다.");
        }
        Long adminId = currentUser.requireId();
        User user = requireModifiable(userId, adminId);
        String trimmedReason = reason == null || reason.isBlank() ? null : reason.trim();
        user.suspend(trimmedReason, until, adminId, now);
        userService.invalidateSessions(user);
        return AdminUserResult.detail(user, now);
    }

    @Transactional
    public AdminUserResult unsuspend(Long userId) {
        User user = requireUser(userId);
        if (user.getStatus() == UserStatus.SUSPENDED) {
            user.unsuspend();
        }
        return AdminUserResult.detail(user, LocalDateTime.now());
    }

    @Transactional
    public AdminUserResult changeRole(Long userId, Role role) {
        User user = requireModifiable(userId, currentUser.requireId());
        if (user.getRole() != role) {
            user.changeRole(role);
            userService.invalidateSessions(user);
        }
        return AdminUserResult.detail(user, LocalDateTime.now());
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));
    }

    private User requireModifiable(Long userId, Long adminId) {
        if (userId.equals(adminId)) {
            throw new BusinessException(UserErrorCode.CANNOT_MODIFY_SELF);
        }
        User user = requireUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw new BusinessException(UserErrorCode.CANNOT_MODIFY_ADMIN);
        }
        return user;
    }
}
