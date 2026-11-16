package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReadingSessionRewardHookTest {

    @Mock
    private ReadingSessionRewardService readingSessionRewardService;
    @InjectMocks
    private ReadingSessionRewardHook hook;

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void 트랜잭션_안에서_호출하면_커밋된_뒤에_보상을_처리한다() {
        TransactionSynchronizationManager.initSynchronization();

        hook.onSessionSaved(1L, 1800, 30, 52);
        verify(readingSessionRewardService, never()).grant(anyLong(), anyInt(), anyInt(), anyInt());

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(readingSessionRewardService).grant(1L, 1800, 30, 52);
    }

    @Test
    void 트랜잭션_밖에서_호출하면_바로_처리한다() {
        hook.onSessionSaved(1L, 600, 0, 10);

        verify(readingSessionRewardService).grant(1L, 600, 0, 10);
    }

    @Test
    void 보상_처리가_실패해도_예외를_던지지_않는다() {
        when(readingSessionRewardService.grant(1L, 600, 0, 10))
                .thenThrow(new RewardException(RewardErrorCode.CONCURRENT_REQUEST));

        assertThatCode(() -> hook.onSessionSaved(1L, 600, 0, 10)).doesNotThrowAnyException();
    }
}
