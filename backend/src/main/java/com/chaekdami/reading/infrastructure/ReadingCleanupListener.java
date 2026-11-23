package com.chaekdami.reading.infrastructure;

import com.chaekdami.reading.application.ReadingCleanupService;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

// 회원 탈퇴 이벤트를 받아 reading 데이터를 지운다 (탈퇴와 같은 트랜잭션, 스펙 003 R4)
@Component
@RequiredArgsConstructor
public class ReadingCleanupListener {

    private final ReadingCleanupService readingCleanupService;

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        readingCleanupService.deleteAllOfUser(event.userId());
    }
}
