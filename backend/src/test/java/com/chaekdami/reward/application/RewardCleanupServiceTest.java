package com.chaekdami.reward.application;

import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.RewardCleanupListener;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository;
import com.chaekdami.reward.infrastructure.StreakLogRepository;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import com.chaekdami.reward.infrastructure.UserQuestRepository;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verifyNoMoreInteractions;

@ExtendWith(MockitoExtension.class)
class RewardCleanupServiceTest {

    private static final Long USER_ID = 7L;

    @Mock
    private UserQuestRepository userQuestRepository;
    @Mock
    private UserItemRepository userItemRepository;
    @Mock
    private UserBuffRepository userBuffRepository;
    @Mock
    private StreakLogRepository streakLogRepository;
    @Mock
    private RewardTransactionRepository rewardTransactionRepository;
    @Mock
    private RewardAccountRepository rewardAccountRepository;
    @InjectMocks
    private RewardCleanupService rewardCleanupService;

    @Test
    void 탈퇴_이벤트를_받으면_사용자의_보상_데이터를_모두_지우고_계정은_마지막에_지운다() {
        new RewardCleanupListener(rewardCleanupService).onUserWithdrawn(new UserWithdrawnEvent(USER_ID));

        InOrder order = inOrder(userQuestRepository, userItemRepository, userBuffRepository,
                streakLogRepository, rewardTransactionRepository, rewardAccountRepository);
        order.verify(userQuestRepository).deleteAllByUserId(USER_ID);
        order.verify(userItemRepository).deleteAllByUserId(USER_ID);
        order.verify(userBuffRepository).deleteAllByUserId(USER_ID);
        order.verify(streakLogRepository).deleteAllByUserId(USER_ID);
        order.verify(rewardTransactionRepository).deleteAllByUserId(USER_ID);
        order.verify(rewardAccountRepository).deleteAllByUserId(USER_ID);
        verifyNoMoreInteractions(userQuestRepository, userItemRepository, userBuffRepository,
                streakLogRepository, rewardTransactionRepository, rewardAccountRepository);
    }
}
