package com.chaekdami.user.infrastructure;

import com.chaekdami.user.application.EmailVerificationNotifier;
import com.chaekdami.user.application.OutboundMail;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class SmtpEmailVerificationNotifier implements EmailVerificationNotifier {

    private final OutboundMail outboundMail;
    private final String publicBaseUrl;

    public SmtpEmailVerificationNotifier(OutboundMail outboundMail,
                                         @Value("${app.public-base-url}") String publicBaseUrl) {
        this.outboundMail = outboundMail;
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
    }

    @Override
    public void send(String email, String rawToken) {
        String link = publicBaseUrl + "/email/verify?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        outboundMail.send(email, "책다듬이 이메일 인증",
                "아래 주소에서 인증 버튼을 눌러 주세요.\n이 링크는 24시간 동안 한 번만 사용할 수 있습니다.\n\n" + link);
    }
}
