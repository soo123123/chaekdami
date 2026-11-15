package com.chaekdami.user.presentation;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientAddress {

    private ClientAddress() {
    }

    public static String from(HttpServletRequest request) {
        String address = request.getRemoteAddr();
        if (address == null || address.isBlank()) {
            return "unknown";
        }
        return address;
    }
}
