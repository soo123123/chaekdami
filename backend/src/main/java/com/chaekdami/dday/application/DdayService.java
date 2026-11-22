package com.chaekdami.dday.application;

import com.chaekdami.dday.domain.DdayGoal;
import com.chaekdami.dday.domain.DdayRecord;
import com.chaekdami.dday.domain.DdayRecordStatus;
import com.chaekdami.dday.infrastructure.DdayGoalRepository;
import com.chaekdami.dday.infrastructure.DdayRecordRepository;
import com.chaekdami.dday.presentation.dto.DdayGoalRequest;
import com.chaekdami.dday.presentation.dto.DdayGoalResponse;
import com.chaekdami.dday.presentation.dto.DdayResponse;
import com.chaekdami.dday.presentation.dto.DdaySaveRequest;
import com.chaekdami.reward.application.StreakService;
import com.chaekdami.reward.domain.StreakCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DdayService {

    private static final int MAX_GOALS = 30;
    private static final int MAX_TITLE_LENGTH = 100;
    private static final int MAX_BOOKS = 999;

    private final DdayGoalRepository ddayGoalRepository;
    private final DdayRecordRepository ddayRecordRepository;
    private final StreakService streakService;

    /**
     * 목표와 달력을 조회한다. 놓친 날이 있으면 방어권 자동 차감(BE2 StreakService)을 먼저 정산하므로 쓰기 트랜잭션이다.
     * 연속 일수는 서버가 계산한 값이다. (읽은 날 +1, 방어한 날 +0)
     */
    @Transactional
    public DdayResponse get(Long userId) {
        LocalDate today = LocalDate.now();
        streakService.settleBefore(userId, today);

        List<DdayGoalResponse> goals = ddayGoalRepository.findAllByUserIdOrderByTargetDateAscIdAsc(userId).stream()
                .map(DdayGoalResponse::from)
                .toList();
        Map<String, String> records = new LinkedHashMap<>();
        for (DdayRecord record : ddayRecordRepository.findAllByUserIdOrderByRecordDateAsc(userId)) {
            records.put(record.getRecordDate().toString(), record.getStatus().code());
        }
        StreakCalculator.Summary streak = streakService.summarize(userId, today);
        return new DdayResponse(goals, records, streak.currentStreak(), streak.longestStreak());
    }

    /**
     * 목표만 저장한다. 달력 기록은 서버가 쓴다(독서 완료 보상의 "읽음", 방어권 자동 차감의 "방어").
     * 요청에 records 가 와도 무시한다. (클라이언트가 방어권 없이 "방어"를 기록하지 못하게)
     */
    @Transactional
    public DdayResponse save(Long userId, DdaySaveRequest request) {
        saveGoals(userId, request == null ? null : request.goals());
        return get(userId);
    }

    @Transactional
    public void markTodayRead(Long userId) {
        LocalDate today = LocalDate.now();
        DdayRecord record = ddayRecordRepository.findByUserIdAndRecordDate(userId, today).orElse(null);
        if (record == null) {
            ddayRecordRepository.save(DdayRecord.create(userId, today, DdayRecordStatus.READ));
            return;
        }
        if (record.getStatus() != DdayRecordStatus.READ) {
            record.changeStatus(DdayRecordStatus.READ);
        }
    }

    /**
     * readDate 날짜를 읽은 날로 기록한다. 독서 완료 보상(BE2)이 세션 종료 날짜로 호출해,
     * 완료 화면이 자정을 넘겨 열려도 독서한 날에 기록된다.
     */
    @Transactional
    public void markRead(Long userId, LocalDate readDate) {
        DdayRecord record = ddayRecordRepository.findByUserIdAndRecordDate(userId, readDate).orElse(null);
        if (record == null) {
            ddayRecordRepository.save(DdayRecord.create(userId, readDate, DdayRecordStatus.READ));
            return;
        }
        if (record.getStatus() != DdayRecordStatus.READ) {
            record.changeStatus(DdayRecordStatus.READ);
        }
    }

    /**
     * 회원 탈퇴 시 사용자의 D-day 목표와 달력 기록을 지운다. dday 테이블은 users 에 DB FK 가 없어서 여기서 함께 지운다.
     * 호출한 쪽(회원 탈퇴)의 트랜잭션에 참여해 탈퇴와 함께 커밋되거나 롤백된다.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void deleteAllOfUser(Long userId) {
        ddayRecordRepository.deleteAllByUserId(userId);
        ddayGoalRepository.deleteAllByUserId(userId);
    }

    private void saveGoals(Long userId, List<DdayGoalRequest> requests) {
        List<DdayGoalRequest> goals = requests == null ? List.of() : requests;
        if (goals.size() > MAX_GOALS) {
            throw new IllegalArgumentException("목표는 " + MAX_GOALS + "개까지 저장할 수 있습니다.");
        }

        List<DdayGoal> existing = ddayGoalRepository.findAllByUserIdOrderByTargetDateAscIdAsc(userId);
        Map<Long, DdayGoal> byId = new LinkedHashMap<>();
        for (DdayGoal goal : existing) {
            byId.put(goal.getId(), goal);
        }

        Set<Long> seenIds = new HashSet<>();
        Set<Long> keep = new HashSet<>();
        for (DdayGoalRequest request : goals) {
            String title = request.title() == null ? "" : request.title().trim();
            if (title.isEmpty() || title.length() > MAX_TITLE_LENGTH) {
                throw new IllegalArgumentException("목표 제목은 1자 이상 " + MAX_TITLE_LENGTH + "자 이하여야 합니다.");
            }
            if (request.targetDate() == null) {
                throw new IllegalArgumentException("목표 날짜를 입력해야 합니다.");
            }
            int targetBooks = request.targetBooks() == null ? 0 : request.targetBooks();
            int completedBooks = request.completedBooks() == null ? 0 : request.completedBooks();
            if (targetBooks < 1 || targetBooks > MAX_BOOKS || completedBooks < 0 || completedBooks > targetBooks) {
                throw new IllegalArgumentException("목표 권수와 완료 권수를 확인해 주세요.");
            }
            if (request.id() != null && !seenIds.add(request.id())) {
                throw new IllegalArgumentException("같은 목표를 두 번 보냈습니다.");
            }

            DdayGoal goal = request.id() == null ? null : byId.get(request.id());
            if (goal == null) {
                goal = ddayGoalRepository.save(DdayGoal.create(
                        userId, title, request.targetDate(), targetBooks, completedBooks));
            } else {
                goal.change(title, request.targetDate(), targetBooks, completedBooks);
            }
            keep.add(goal.getId());
        }

        for (DdayGoal goal : existing) {
            if (!keep.contains(goal.getId())) {
                ddayGoalRepository.delete(goal);
            }
        }
    }

}
