package com.chaekdami.user.presentation;

import com.chaekdami.user.application.UserService;
import com.chaekdami.user.application.command.PasswordResetCommand;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.presentation.dto.ResetPasswordRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
public class EmailPageController {

    private final UserService userService;

    @GetMapping("/email/verify")
    public ResponseEntity<String> verifyForm(@RequestParam String token) {
        return html(page("이메일 인증", """
                <p>아래 버튼을 누르면 이메일 인증이 완료됩니다.</p>
                <form method="post" action="/email/verify">
                  <input type="hidden" name="token" value="%s">
                  <button type="submit">이메일 인증</button>
                </form>
                """.formatted(escape(token))));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<String> verify(@RequestParam String token) {
        try {
            userService.verifyEmail(token);
            return html(page("이메일 인증", "<p>이메일 인증이 완료되었습니다. 앱에서 로그인해 주세요.</p>"));
        } catch (InvalidRequestException exception) {
            return html(page("이메일 인증", "<p>" + escape(exception.getMessage()) + "</p>"));
        }
    }

    @GetMapping("/email/reset")
    public ResponseEntity<String> resetForm(@RequestParam String token) {
        return html(resetPage(token, null));
    }

    @PostMapping(value = "/email/reset", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> reset(@Valid ResetPasswordRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError() == null
                    ? "요청 값이 올바르지 않습니다."
                    : bindingResult.getFieldError().getDefaultMessage();
            return html(resetPage(request.getToken(), message));
        }
        try {
            userService.resetPassword(new PasswordResetCommand(request.getToken(), request.getNewPassword()));
            return html(page("비밀번호 재설정", "<p>비밀번호를 변경했습니다. 앱에서 로그인해 주세요.</p>"));
        } catch (InvalidRequestException exception) {
            return html(resetPage(request.getToken(), exception.getMessage()));
        }
    }

    private static String resetPage(String token, String error) {
        String errorHtml = error == null ? "" : "<p>" + escape(error) + "</p>";
        return page("비밀번호 재설정", """
                %s
                <form method="post" action="/email/reset">
                  <input type="hidden" name="token" value="%s">
                  <label>새 비밀번호<input type="password" name="newPassword" required></label>
                  <button type="submit">비밀번호 변경</button>
                </form>
                """.formatted(errorHtml, escape(token == null ? "" : token)));
    }

    private static ResponseEntity<String> html(String body) {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "html", StandardCharsets.UTF_8))
                .body(body);
    }

    private static String page(String title, String content) {
        return """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>%s</title>
                </head>
                <body>
                  <main>
                    <h1>%s</h1>
                    %s
                  </main>
                </body>
                </html>
                """.formatted(escape(title), escape(title), content);
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
