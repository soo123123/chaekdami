package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.ExperiencePolicy;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.UserBuff;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 경험치 부스터 사용. 보유한 부스터 1개를 써서 책 읽는 30분 동안 독서 경험치를 2배로 만든다.
 * - 부스터 시간은 책을 읽는 동안에만 줄어든다. 남으면 다음 독서에 이어서 쓴다. (스펙 009)
 * - 남아 있을 때 또 쓰면 30분이 더해진다. (배율은 그대로)
 * - 배율은 독서 경험치에만 적용되고, 퀘스트 보상 경험치와 사진 인증 추가 경험치에는 적용되지 않는다.
 * - 독서 경험치는 독서 시간 중 부스터가 적용된 시간 비율만큼만 2배가 된다. (예: 60분 중 20분 적용 -> 1/3만큼 추가)
 */
@Service
@RequiredArgsConstructor
public class BoosterService {

    private final UserItemRepository userItemRepository;
    private final UserBuffRepository userBuffRepository;
    private final RewardLedger rewardLedger;

    @Transactional
    public BoosterUseResult use(Long userId) {
        rewardLedger.lockAccount(userId);
        UserItem booster = userItemRepository
                .findAllInStockByUserIdAndItemType(userId, ShopItemType.EXPERIENCE_BOOSTER).stream()
                .findFirst()
                .orElseThrow(() -> new RewardException(RewardErrorCode.NO_BOOSTER));
        booster.deductQuantity(1);

        userBuffRepository.save(UserBuff.builder()
                .userId(userId)
                .buffActivated(true)
                .buffStartAt(LocalDateTime.now())
                .remainingSeconds((int) ExperiencePolicy.BOOSTER_DURATION.getSeconds())
                .build());

        int remaining = userItemRepository.sumQuantityByUserIdAndItemType(userId, ShopItemType.EXPERIENCE_BOOSTER);
        return new BoosterUseResult(Math.toIntExact(userBuffRepository.sumRemainingSeconds(userId)), remaining);
    }
}
