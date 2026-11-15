package com.chaekdami.user.application;

public interface OutboundMail {

    void send(String to, String subject, String body);
}
