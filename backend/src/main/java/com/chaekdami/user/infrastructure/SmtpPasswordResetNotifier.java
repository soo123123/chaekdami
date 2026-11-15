package com.chaekdami.user.infrastructure;

import com.chaekdami.user.application.OutboundMail;
import com.chaekdami.user.application.PasswordResetNotifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class SmtpPasswordResetNotifier implements PasswordResetNotifier {

    private final OutboundMail outboundMail;
    private final String publicBaseUrl;

    public SmtpPasswordResetNotifier(OutboundMail outboundMail,
                                     @Value("${app.public-base-url}") String publicBaseUrl) {
        this.outboundMail = outboundMail;
        this.publicBaseUrl = stripTrailingSlash(publicBaseUrl);
    }

    @Override
    public void send(String email, String rawToken) {
        String link = publicBaseUrl + "/email/reset?token=" + encode(rawToken);
        outboundMail.send(email, "책다듬이 비밀번호 재설정",
                "아래 주소에서 새 비밀번호를 설정해 주세요.\n이 링크는 15분 동안 한 번만 사용할 수 있습니다.\n\n" + link);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String stripTrailingSlash(String value) {
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }
}
