package com.chaekdami.user.presentation;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.user.application.UserAdminService;
import com.chaekdami.user.application.result.AdminUserResult;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.UserStatus;
import com.chaekdami.user.presentation.dto.ChangeRoleRequest;
import com.chaekdami.user.presentation.dto.SuspendRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 회원 관리. 앱 화면 없이 http 요청으로 쓴다. /api/admin/** 는 ADMIN만 부를 수 있다.
 */
@RestController
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping("/api/admin/users")
    public ResponseEntity<PageResponse<AdminUserResult>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userAdminService.search(query, role, status, page, size));
    }

    @GetMapping("/api/admin/users/{userId}")
    public ResponseEntity<AdminUserResult> get(@PathVariable Long userId) {
        return ResponseEntity.ok(userAdminService.get(userId));
    }

    @PutMapping("/api/admin/users/{userId}/suspension")
    public ResponseEntity<AdminUserResult> suspend(@PathVariable Long userId,
                                                   @RequestBody @Valid SuspendRequest request) {
        return ResponseEntity.ok(userAdminService.suspend(userId, request.getReason(), request.getUntil()));
    }

    @DeleteMapping("/api/admin/users/{userId}/suspension")
    public ResponseEntity<AdminUserResult> unsuspend(@PathVariable Long userId) {
        return ResponseEntity.ok(userAdminService.unsuspend(userId));
    }

    @PatchMapping("/api/admin/users/{userId}/role")
    public ResponseEntity<AdminUserResult> changeRole(@PathVariable Long userId,
                                                      @RequestBody @Valid ChangeRoleRequest request) {
        return ResponseEntity.ok(userAdminService.changeRole(userId, request.getRole()));
    }
}
