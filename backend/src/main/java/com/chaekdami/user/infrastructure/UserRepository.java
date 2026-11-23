package com.chaekdami.user.infrastructure;

import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByNicknameIgnoreCase(String nickname);

    /**
     * 관리자 목록. Postgres에서 null 파라미터 비교가 타입 오류를 내지 않도록 null을 받지 않는다.
     * query는 소문자 검색어(빈 문자열이면 전체), roles는 포함할 역할,
     * includeSuspended·includeActive는 지금 정지 중인 회원·아닌 회원(끝 시각이 지난 정지 포함)을 넣을지.
     */
    @Query("""
            select u from User u
            where (lower(u.email) like concat('%', :query, '%')
                   or u.nicknameLower like concat('%', :query, '%'))
              and u.role in :roles
              and ((:includeSuspended = true
                    and u.status = com.chaekdami.user.domain.UserStatus.SUSPENDED
                    and (u.suspendedUntil is null or u.suspendedUntil > :now))
                or (:includeActive = true
                    and (u.status is null
                         or u.status <> com.chaekdami.user.domain.UserStatus.SUSPENDED
                         or u.suspendedUntil <= :now)))
            """)
    Page<User> searchForAdmin(@Param("query") String query, @Param("roles") Collection<Role> roles,
                              @Param("includeSuspended") boolean includeSuspended,
                              @Param("includeActive") boolean includeActive,
                              @Param("now") LocalDateTime now, Pageable pageable);
}