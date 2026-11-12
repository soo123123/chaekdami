package com.chaekdami.review.infrastructure;

import com.chaekdami.review.application.ReviewCleanupService;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReviewCleanupListener {

    private final ReviewCleanupService reviewCleanupService;

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        reviewCleanupService.deleteAllOfUser(event.userId());
    }
}
