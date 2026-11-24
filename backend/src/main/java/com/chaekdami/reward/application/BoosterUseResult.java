package com.chaekdami.reward.application;

/**
 * 경험치 부스터 사용 결과
 *
 * @param boosterRemainingSeconds 사용 후 남은 부스터 시간(초). 책을 읽는 동안에만 줄어든다
 * @param remainingBoosters       사용 후 남은 부스터 수
 */
public record BoosterUseResult(
        int boosterRemainingSeconds,
        int remainingBoosters
) {
}
