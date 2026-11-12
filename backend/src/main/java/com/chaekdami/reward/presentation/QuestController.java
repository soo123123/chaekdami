package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.QuestService;
import com.chaekdami.reward.presentation.dto.QuestRewardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 퀘스트 API. 로그인 구현 전까지 사용자는 X-User-Id 헤더로 식별한다.
 */
@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;

    /**
     * 완료된 퀘스트의 보상 수령. 팀 협의 전 임시 엔드포인트.
     */
    @PostMapping("/{userQuestId}/reward")
    public QuestRewardResponse claimReward(@RequestHeader("X-User-Id") Long userId,
                                           @PathVariable Long userQuestId) {
        return QuestRewardResponse.from(questService.claimReward(userId, userQuestId));
    }
}
