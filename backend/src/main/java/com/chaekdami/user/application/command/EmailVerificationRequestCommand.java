package com.chaekdami.user.application.command;

public record EmailVerificationRequestCommand(String email, String clientIp) {
}
