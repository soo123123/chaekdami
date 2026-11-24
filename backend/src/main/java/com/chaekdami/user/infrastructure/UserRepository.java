package com.chaekdami.user.infrastructure;

import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("""
            select new com.chaekdami.user.infrastructure.LoginCredential(u.id, u.passwordHash)
            from User u where u.email = :email
            """)
    Optional<LoginCredential> findLoginCredential(@Param("email") String email);

    /** 토큰 발급과 폐기(정지·비밀번호 변경·로그아웃)가 엇갈리지 않도록 회원 행을 잠근다. 트랜잭션 안에서만 부른다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

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