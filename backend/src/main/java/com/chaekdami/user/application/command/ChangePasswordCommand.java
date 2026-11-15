package com.chaekdami.user.application.command;

public record ChangePasswordCommand(String currentPassword, String newPassword) {
}
