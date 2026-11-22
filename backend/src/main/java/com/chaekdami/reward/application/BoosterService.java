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
import java.util.List;

/**
 * 경험치 부스터 사용. 보유한 부스터 1개를 써서 30분 동안 독서 경험치를 2배로 만든다.
 * - 적용 중에 또 쓰면 남은 시간에 30분이 더해진다. (배율은 그대로)
 * - 배율은 독서 경험치에만 적용되고, 퀘스트 보상 경험치와 사진 인증 추가 경험치에는 적용되지 않는다.
 * - 독서 경험치는 세션이 끝난 시각에 부스터가 적용 중이었는지로 판단한다.
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

        LocalDateTime now = LocalDateTime.now();
        List<UserBuff> activeBuffs = userBuffRepository.findActiveBuffs(userId, now);
        UserBuff buff;
        if (activeBuffs.isEmpty()) {
            buff = userBuffRepository.save(UserBuff.builder()
                    .userId(userId)
                    .buffActivated(true)
                    .buffStartAt(now)
                    .buffEndAt(now.plus(ExperiencePolicy.BOOSTER_DURATION))
                    .build());
        } else {
            buff = activeBuffs.get(0);
            buff.extend(ExperiencePolicy.BOOSTER_DURATION);
        }

        int remaining = userItemRepository.sumQuantityByUserIdAndItemType(userId, ShopItemType.EXPERIENCE_BOOSTER);
        return new BoosterUseResult(buff.getBuffEndAt(), remaining);
    }
}
