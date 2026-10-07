package com.chaekdami.user.application;

public interface PasswordResetNotifier {

    void send(String email, String rawToken);
}
