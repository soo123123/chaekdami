package com.chaekdami.user.application;

public interface EmailVerificationNotifier {

    void send(String email, String rawToken);
}
