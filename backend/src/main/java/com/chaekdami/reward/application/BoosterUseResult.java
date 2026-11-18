package com.chaekdami.reward.application;

import java.time.LocalDateTime;

/**
 * 경험치 부스터 사용 결과
 *
 * @param buffEndAt         부스터 효과가 끝나는 시각 (연장했으면 연장된 시각)
 * @param remainingBoosters 사용 후 남은 부스터 수
 */
public record BoosterUseResult(
        LocalDateTime buffEndAt,
        int remainingBoosters
) {
}
