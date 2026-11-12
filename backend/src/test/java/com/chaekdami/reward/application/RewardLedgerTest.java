package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewardLedgerTest {

    private static final Long USER_ID = 1L;

    @Mock
    private RewardAccountRepository rewardAccountRepository;
    @Mock
    private RewardTransactionRepository rewardTransactionRepository;
    @Mock
    private RewardAccountInitializer rewardAccountInitializer;
    @InjectMocks
    private RewardLedger rewardLedger;

    private final RewardAccount account = RewardAccount.builder().userId(USER_ID).build();

    @Test
    void 계정이_있으면_잠금_조회만_한다() {
        when(rewardAccountRepository.findByUserIdWithLock(USER_ID)).thenReturn(Optional.of(account));

        assertThat(rewardLedger.lockAccount(USER_ID)).isSameAs(account);
        verify(rewardAccountInitializer, never()).insert(any());
    }

    @Test
    void 계정이_없으면_만든_뒤_잠근다() {
        when(rewardAccountRepository.findByUserIdWithLock(USER_ID))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(account));
        when(rewardAccountRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

        assertThat(rewardLedger.lockAccount(USER_ID)).isSameAs(account);
        verify(rewardAccountInitializer).insert(USER_ID);
    }

    @Test
    void 동시_요청이_먼저_계정을_만들었으면_그_계정을_쓴다() {
        when(rewardAccountRepository.findByUserIdWithLock(USER_ID))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(account));
        when(rewardAccountRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        doThrow(new DataIntegrityViolationException("uk_reward_accounts_user_id"))
                .when(rewardAccountInitializer).insert(USER_ID);

        assertThat(rewardLedger.lockAccount(USER_ID)).isSameAs(account);
    }

    @Test
    void 잠금_대기_시간을_넘기면_CONCURRENCY_001() {
        when(rewardAccountRepository.findByUserIdWithLock(USER_ID))
                .thenThrow(new PessimisticLockingFailureException("lock timeout"));

        assertThatThrownBy(() -> rewardLedger.lockAccount(USER_ID))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.CONCURRENT_REQUEST);
    }
}
