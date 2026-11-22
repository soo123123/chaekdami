package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.ReadingSessionRewardService;
import com.chaekdami.reward.presentation.dto.ReadingSessionRewardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 독서 완료 화면 보상 API. 독서 세션 저장 응답의 id 로 호출한다.
 * 같은 세션으로 다시 호출해도 이미 받은 보상은 다시 지급하지 않는다.
 */
@RestController
@RequestMapping("/api/rewards/reading-sessions")
@RequiredArgsConstructor
public class ReadingSessionRewardController {

    private final ReadingSessionRewardService readingSessionRewardService;

    @PostMapping("/{readingSessionId}")
    public ReadingSessionRewardResponse grant(@RequestHeader("X-User-Id") Long userId,
                                              @PathVariable Long readingSessionId) {
        return ReadingSessionRewardResponse.from(readingSessionRewardService.grant(userId, readingSessionId));
    }
}
