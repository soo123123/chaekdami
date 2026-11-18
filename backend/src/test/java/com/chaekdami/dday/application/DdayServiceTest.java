package com.chaekdami.dday.application;

import com.chaekdami.dday.infrastructure.DdayCleanupListener;
import com.chaekdami.dday.infrastructure.DdayGoalRepository;
import com.chaekdami.dday.infrastructure.DdayRecordRepository;
import com.chaekdami.dday.presentation.dto.DdayResponse;
import com.chaekdami.dday.presentation.dto.DdaySaveRequest;
import com.chaekdami.reward.application.StreakService;
import com.chaekdami.reward.domain.StreakCalculator;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DdayServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private DdayGoalRepository ddayGoalRepository;
    @Mock
    private DdayRecordRepository ddayRecordRepository;
    @Mock
    private StreakService streakService;
    @InjectMocks
    private DdayService ddayService;

    @BeforeEach
    void setUp() {
        lenient().when(streakService.summarize(eq(USER_ID), any(LocalDate.class)))
                .thenReturn(new StreakCalculator.Summary(4, 7));
    }

    @Test
    void 탈퇴_이벤트를_받으면_D_day_기록과_목표를_지운다() {
        new DdayCleanupListener(ddayService).onUserWithdrawn(new UserWithdrawnEvent(USER_ID));

        verify(ddayRecordRepository).deleteAllByUserId(USER_ID);
        verify(ddayGoalRepository).deleteAllByUserId(USER_ID);
    }

    @Test
    void 조회하면_놓친_날을_먼저_정산하고_서버가_계산한_연속_일수를_준다() {
        DdayResponse response = ddayService.get(USER_ID);

        InOrder order = inOrder(streakService, ddayRecordRepository);
        order.verify(streakService).settleBefore(eq(USER_ID), any(LocalDate.class));
        order.verify(ddayRecordRepository).findAllByUserIdOrderByRecordDateAsc(USER_ID);
        assertThat(response.currentStreak()).isEqualTo(4);
        assertThat(response.longestStreak()).isEqualTo(7);
    }

    @Test
    void 저장_요청의_달력_기록은_무시한다() {
        DdaySaveRequest request = new DdaySaveRequest(List.of(), Map.of("2026-11-18", "protected"));

        ddayService.save(USER_ID, request);

        verify(ddayRecordRepository, never()).save(any());
        verify(ddayRecordRepository, never()).delete(any());
    }
}
