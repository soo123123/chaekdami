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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DdayService {

    private static final int MAX_GOALS = 30;
    private static final int MAX_RECORDS = 800;
    private static final int MAX_TITLE_LENGTH = 100;
    private static final int MAX_BOOKS = 999;

    private final DdayGoalRepository ddayGoalRepository;
    private final DdayRecordRepository ddayRecordRepository;

    @Transactional(readOnly = true)
    public DdayResponse get(Long userId) {
        List<DdayGoalResponse> goals = ddayGoalRepository.findAllByUserIdOrderByTargetDateAscIdAsc(userId).stream()
                .map(DdayGoalResponse::from)
                .toList();
        Map<String, String> records = new LinkedHashMap<>();
        for (DdayRecord record : ddayRecordRepository.findAllByUserIdOrderByRecordDateAsc(userId)) {
            records.put(record.getRecordDate().toString(), record.getStatus().code());
        }
        return new DdayResponse(goals, records);
    }

    @Transactional
    public DdayResponse save(Long userId, DdaySaveRequest request) {
        saveGoals(userId, request == null ? null : request.goals());
        saveRecords(userId, request == null ? null : request.records());
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

    private void saveRecords(Long userId, Map<String, String> requests) {
        Map<String, String> records = requests == null ? Map.of() : requests;
        if (records.size() > MAX_RECORDS) {
            throw new IllegalArgumentException("달력 기록은 " + MAX_RECORDS + "개까지 저장할 수 있습니다.");
        }

        List<DdayRecord> existing = ddayRecordRepository.findAllByUserIdOrderByRecordDateAsc(userId);
        Map<LocalDate, DdayRecord> byDate = new LinkedHashMap<>();
        for (DdayRecord record : existing) {
            byDate.put(record.getRecordDate(), record);
        }

        Set<LocalDate> keep = new HashSet<>();
        for (Map.Entry<String, String> entry : records.entrySet()) {
            LocalDate date = parseDate(entry.getKey());
            DdayRecordStatus status = DdayRecordStatus.fromCode(entry.getValue());
            DdayRecord record = byDate.get(date);
            if (record == null) {
                ddayRecordRepository.save(DdayRecord.create(userId, date, status));
            } else {
                record.changeStatus(status);
            }
            keep.add(date);
        }

        for (DdayRecord record : existing) {
            if (!keep.contains(record.getRecordDate())) {
                ddayRecordRepository.delete(record);
            }
        }
    }

    private static LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("달력 날짜는 yyyy-MM-dd 여야 합니다.");
        }
    }
}
