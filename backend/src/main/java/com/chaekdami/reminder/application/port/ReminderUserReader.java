package com.chaekdami.reminder.application.port;

/**
 * 회원 도메인(BE3)의 닉네임을 읽는 포트. 알림 제목에 쓴다. (스펙 014 R5.4)
 */
public interface ReminderUserReader {

    /**
     * 회원이 없으면 빈 문자열
     */
    String nicknameOf(Long userId);
}
