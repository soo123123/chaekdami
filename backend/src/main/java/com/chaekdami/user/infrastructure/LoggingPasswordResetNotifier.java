package com.chaekdami.user.infrastructure;

import com.chaekdami.user.application.PasswordResetNotifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LoggingPasswordResetNotifier implements PasswordResetNotifier {

    @Override
    public void send(String email, String rawToken) {
        log.info("비밀번호 재설정 토큰 발급. email={} token={}", email, rawToken);
    }
}
