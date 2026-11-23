package com.chaekdami.user.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.application.result.AdminUserResult;
import com.chaekdami.user.domain.RefreshToken;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.domain.UserErrorCode;
import com.chaekdami.user.domain.UserStatus;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserAdminServiceTest {

    private static final Long ADMIN_ID = 1L;

    private final UserRepository userRepository = mock(UserRepository.class);
    private final RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);
    private UserAdminService service;
    private User target;
    private RefreshToken targetRefreshToken;

    @BeforeEach
    void setUp() {
        CurrentUser currentUser = new CurrentUser();
        UserService userService = new UserService(userRepository, refreshTokenRepository, null, null, null,
                null, null, currentUser, new AccessGuard(currentUser), null);
        service = new UserAdminService(userRepository, userService, currentUser);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                ADMIN_ID, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        target = user(2L, Role.USER);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        targetRefreshToken = new RefreshToken(target, "hash", LocalDateTime.now().plusDays(1));
        when(refreshTokenRepository.findAllByUser_IdAndRevokedAtIsNull(2L)).thenReturn(List.of(targetRefreshToken));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void suspendRecordsReasonAndInvalidatesSessions() {
        LocalDateTime until = LocalDateTime.now().plusDays(7);

        AdminUserResult result = service.suspend(2L, "  신고 누적  ", until);

        assertEquals("SUSPENDED", result.status());
        assertEquals(until, result.suspendedUntil());
        assertEquals("신고 누적", result.suspensionReason());
        assertEquals(ADMIN_ID, result.suspendedBy());
        assertNotNull(result.suspendedAt());
        assertEquals(1L, target.getTokenVersion());
        assertTrue(targetRefreshToken.isRevoked());
    }

    @Test
    void suspendWithoutUntilIsIndefinite() {
        AdminUserResult result = service.suspend(2L, null, null);

        assertEquals("SUSPENDED", result.status());
        assertNull(result.suspendedUntil());
        assertTrue(target.isSuspendedAt(LocalDateTime.now().plusYears(5)));
    }

    @Test
    void suspendUntilInThePastIsRejected() {
        InvalidRequestException exception = assertThrows(InvalidRequestException.class,
                () -> service.suspend(2L, null, LocalDateTime.now().minusMinutes(1)));

        assertEquals("until", exception.getField());
        assertFalse(target.isSuspendedAt(LocalDateTime.now()));
        assertEquals(0L, target.getTokenVersion());
    }

    @Test
    void cannotSuspendOrChangeRoleOfSelf() {
        assertErrorCode(UserErrorCode.CANNOT_MODIFY_SELF, () -> service.suspend(ADMIN_ID, null, null));
        assertErrorCode(UserErrorCode.CANNOT_MODIFY_SELF, () -> service.changeRole(ADMIN_ID, Role.USER));
    }

    @Test
    void cannotSuspendOrChangeRoleOfAnotherAdmin() {
        User otherAdmin = user(3L, Role.ADMIN);
        when(userRepository.findById(3L)).thenReturn(Optional.of(otherAdmin));

        assertErrorCode(UserErrorCode.CANNOT_MODIFY_ADMIN, () -> service.suspend(3L, null, null));
        assertErrorCode(UserErrorCode.CANNOT_MODIFY_ADMIN, () -> service.changeRole(3L, Role.USER));
        assertFalse(otherAdmin.isSuspendedAt(LocalDateTime.now()));
        assertEquals(Role.ADMIN, otherAdmin.getRole());
        assertEquals(0L, otherAdmin.getTokenVersion());
    }

    @Test
    void suspendedAdminCanStillBeUnsuspended() {
        User otherAdmin = user(3L, Role.ADMIN);
        otherAdmin.suspend("DB에서 정지", null, 1L, LocalDateTime.now());
        when(userRepository.findById(3L)).thenReturn(Optional.of(otherAdmin));

        AdminUserResult result = service.unsuspend(3L);

        assertEquals("ACTIVE", result.status());
        assertFalse(otherAdmin.isSuspendedAt(LocalDateTime.now()));
    }

    @Test
    void unsuspendOfActiveUserChangesNothing() {
        AdminUserResult result = service.unsuspend(2L);

        assertEquals("ACTIVE", result.status());
        assertNull(target.getStatus());
        assertEquals(0L, target.getTokenVersion());
    }

    @Test
    void unknownUserIsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertErrorCode(UserErrorCode.USER_NOT_FOUND, () -> service.get(99L));
        assertErrorCode(UserErrorCode.USER_NOT_FOUND, () -> service.suspend(99L, null, null));
        assertErrorCode(UserErrorCode.USER_NOT_FOUND, () -> service.unsuspend(99L));
        assertErrorCode(UserErrorCode.USER_NOT_FOUND, () -> service.changeRole(99L, Role.ADMIN));
    }

    @Test
    void changeRoleInvalidatesSessionsSoTheNewRoleNeedsALogin() {
        AdminUserResult result = service.changeRole(2L, Role.ADMIN);

        assertEquals("ADMIN", result.role());
        assertEquals(Role.ADMIN, target.getRole());
        assertEquals(1L, target.getTokenVersion());
        assertTrue(targetRefreshToken.isRevoked());
    }

    @Test
    void changeRoleToTheSameRoleKeepsTokens() {
        service.changeRole(2L, Role.USER);

        assertEquals(0L, target.getTokenVersion());
        assertFalse(targetRefreshToken.isRevoked());
    }

    @Test
    void detailHidesExpiredSuspension() {
        target.suspend("지난 정지", LocalDateTime.now().plusDays(1), ADMIN_ID, LocalDateTime.now().minusDays(3));
        ReflectionTestUtils.setField(target, "suspendedUntil", LocalDateTime.now().minusDays(1));

        AdminUserResult result = service.get(2L);

        assertEquals("ACTIVE", result.status());
        assertNull(result.suspendedUntil());
        assertNull(result.suspensionReason());
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchLowercasesQueryAndMapsFilters() {
        when(userRepository.searchForAdmin(anyString(), any(), anyBoolean(), anyBoolean(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(target)));
        ArgumentCaptor<Collection<Role>> roles = ArgumentCaptor.forClass(Collection.class);

        PageResponse<AdminUserResult> page = service.search("  Reader ", Role.USER, UserStatus.SUSPENDED, 0, 20);

        verify(userRepository).searchForAdmin(eq("reader"), roles.capture(), eq(true), eq(false), any(),
                any(Pageable.class));
        assertEquals(EnumSet.of(Role.USER), EnumSet.copyOf(roles.getValue()));
        assertEquals(1, page.items().size());
        assertNull(page.items().get(0).suspensionReason());
    }

    @Test
    void searchWithoutFiltersIncludesEveryone() {
        when(userRepository.searchForAdmin(anyString(), any(), anyBoolean(), anyBoolean(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search(null, null, null, 0, 20);

        verify(userRepository).searchForAdmin(eq(""), eq(EnumSet.allOf(Role.class)), eq(true), eq(true), any(),
                any(Pageable.class));
    }

    @Test
    void searchRejectsBadPaging() {
        assertThrows(InvalidRequestException.class, () -> service.search(null, null, null, -1, 20));
        assertThrows(InvalidRequestException.class, () -> service.search(null, null, null, 0, 0));
        assertThrows(InvalidRequestException.class,
                () -> service.search(null, null, null, 0, UserAdminService.MAX_PAGE_SIZE + 1));
    }

    private static void assertErrorCode(UserErrorCode expected, org.junit.jupiter.api.function.Executable call) {
        BusinessException exception = assertThrows(BusinessException.class, call);
        assertEquals(expected, exception.getErrorCode());
    }

    private static User user(Long id, Role role) {
        User user = User.builder()
                .email("user" + id + "@chaekdami.local")
                .passwordHash("hash")
                .nickname("user" + id)
                .role(role)
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
