package com.chaekdami.reward.application;

import java.time.LocalDate;
import java.util.List;

/**
 * 주간 랭킹 (스펙 005). 경험치 랭킹과 독서 시간 랭킹이 같은 모양을 쓴다.
 * score 는 경험치 랭킹이면 이번 주 경험치, 독서 시간 랭킹이면 이번 주 독서 시간(초)이다.
 *
 * @param weekStartDate 이번 주 월요일 (한국 날짜)
 * @param weekEndDate   이번 주 일요일 (한국 날짜)
 * @param rankings      상위 30명. 점수 높은 순, 같으면 사용자 번호 작은 순
 * @param myRanking     요청한 사용자. 상위 30명 밖이어도 담는다
 */
public record WeeklyRankingResult(
        LocalDate weekStartDate,
        LocalDate weekEndDate,
        List<Entry> rankings,
        MyRanking myRanking
) {

    /**
     * @param me 요청한 사용자 본인 항목이면 true (사용자 번호는 내보내지 않는다)
     */
    public record Entry(int rank, String nickname, int level, long score, boolean me) {
    }

    /**
     * @param rank 이번 주 점수가 0이면 null (순위 없음)
     */
    public record MyRanking(Integer rank, String nickname, int level, long score) {
    }
}
