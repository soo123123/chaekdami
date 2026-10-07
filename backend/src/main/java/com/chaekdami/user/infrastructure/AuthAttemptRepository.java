package com.chaekdami.user.infrastructure;

import com.chaekdami.user.domain.AuthAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthAttemptRepository extends JpaRepository<AuthAttempt, Long> {

    Optional<AuthAttempt> findByAttemptKey(String attemptKey);
}
