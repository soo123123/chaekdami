package com.chaekdami.user.infrastructure;

import com.chaekdami.user.domain.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    List<EmailVerificationToken> findAllByUser_IdAndUsedAtIsNull(Long userId);
}
