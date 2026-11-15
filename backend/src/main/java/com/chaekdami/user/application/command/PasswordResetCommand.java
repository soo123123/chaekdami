package com.chaekdami.user.application.command;

public record PasswordResetCommand(String token, String newPassword) {
}
