package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.QuestResult;
import com.chaekdami.reward.application.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 퀘스트 API. 퀘스트 보상은 달성 시 독서 완료 보상에서 자동 지급되므로 수령 API 는 없다.
 */
@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;

    @GetMapping
    public List<QuestResult> today(@RequestHeader("X-User-Id") Long userId) {
        return questService.getTodayQuests(userId);
    }
}
