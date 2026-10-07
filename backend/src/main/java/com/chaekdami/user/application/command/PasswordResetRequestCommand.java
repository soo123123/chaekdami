package com.chaekdami.user.application.command;

public record PasswordResetRequestCommand(String email, String clientIp) {
}
