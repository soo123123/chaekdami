package com.chaekdami.reward.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 독서 세션 저장 직후 보상을 처리하는 연동 지점. 독서 도메인은 세션을 저장한 뒤 한 줄로 호출한다.
 * <pre>
 * readingSessionRewardHook.onSessionSaved(userId, readingTime, startPage, endPage);
 * </pre>
 * - 트랜잭션 안에서 호출하면 그 트랜잭션이 커밋된 뒤에 보상을 처리한다. 저장이 롤백되면 보상도 주지 않는다.
 * - 보상 처리 중 오류(예: 같은 사용자 요청이 겹쳐 잠금 대기 초과)가 나도 이미 저장된 독서 기록에는 영향이 없고 로그만 남긴다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReadingSessionRewardHook {

    private final ReadingSessionRewardService readingSessionRewardService;

    public void onSessionSaved(Long userId, int durationSeconds, int startPage, int endPage) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    grantSafely(userId, durationSeconds, startPage, endPage);
                }
            });
            return;
        }
        grantSafely(userId, durationSeconds, startPage, endPage);
    }

    private void grantSafely(Long userId, int durationSeconds, int startPage, int endPage) {
        try {
            readingSessionRewardService.grant(userId, durationSeconds, startPage, endPage);
        } catch (RuntimeException e) {
            log.warn("독서 세션 보상 처리 실패: userId={}, durationSeconds={}, pages={}~{}",
                    userId, durationSeconds, startPage, endPage, e);
        }
    }
}
