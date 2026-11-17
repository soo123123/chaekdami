package com.chaekdami.reward.application;

import com.chaekdami.dday.application.DdayService;
import com.chaekdami.reward.application.port.PhotoCertificationChecker;
import com.chaekdami.reward.application.port.ReadingSessionReader;
import com.chaekdami.reward.domain.QuestStatus;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.TransactionReason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReadingSessionRewardServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long SESSION_ID = 42L;
    private static final LocalDateTime ENDED_AT = LocalDateTime.of(2026, 11, 17, 23, 58);
    private static final LocalDate READING_DATE = ENDED_AT.toLocalDate();

    @Mock
    private RewardLedger rewardLedger;
    @Mock
    private RewardService rewardService;
    @Mock
    private QuestService questService;
    @Mock
    private DdayService ddayService;
    @Mock
    private ReadingSessionReader readingSessionReader;
    @Mock
    private PhotoCertificationChecker photoCertificationChecker;
    @InjectMocks
    private ReadingSessionRewardService service;

    private final RewardAccount account = RewardAccount.builder().userId(USER_ID).build();
    private final ReadingSessionReader.Session session =
            new ReadingSessionReader.Session(SESSION_ID, 1800, 30, 52, ENDED_AT);

    @BeforeEach
    void setUp() {
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
        lenient().when(readingSessionReader.findOwnSession(USER_ID, SESSION_ID)).thenReturn(Optional.of(session));
    }

    @Test
    void 첫_요청이면_독서_경험치_퀘스트_D_day를_세션이_끝난_날짜로_처리한다() {
        baseNotGrantedYet();
        when(rewardService.grantReadingExperience(USER_ID, session))
                .thenReturn(new ReadingRewardResult(34, false, 0, 1));
        QuestResult firstSession = new QuestResult(11L, 1L, "오늘의 첫 독서 세션 시작하기", QuestType.DAILY,
                1, 1, QuestStatus.REWARDED, 50, 10);
        when(questService.recordReadingSession(USER_ID, 1800, READING_DATE)).thenReturn(new QuestSessionResult(
                List.of(firstSession), List.of(new QuestRewardResult(11L, 50, 10, 0, 50, 1))));

        ReadingSessionRewardResult result = service.grant(USER_ID, SESSION_ID);

        assertThat(result.baseGranted()).isTrue();
        assertThat(result.reading().experience()).isEqualTo(34);
        assertThat(result.completedQuests()).singleElement()
                .satisfies(quest -> assertThat(quest.title()).isEqualTo("오늘의 첫 독서 세션 시작하기"));
        assertThat(result.photoBonus().granted()).isFalse();
        verify(ddayService).markRead(USER_ID, READING_DATE);
    }

    @Test
    void 이미_기본_보상을_받은_세션이면_다시_지급하지_않는다() {
        when(rewardLedger.isExperienceGranted(USER_ID, TransactionReason.READING_COMPLETE, SESSION_ID)).thenReturn(true);

        ReadingSessionRewardResult result = service.grant(USER_ID, SESSION_ID);

        assertThat(result.baseGranted()).isFalse();
        assertThat(result.reading().experience()).isZero();
        verify(rewardService, never()).grantReadingExperience(any(), any());
        verify(questService, never()).recordReadingSession(any(), anyInt(), any());
        verify(ddayService, never()).markRead(any(), any());
    }

    @Test
    void 사진_인증된_세션은_추가_경험치_20을_지급한다() {
        alreadyBaseGranted();
        when(photoCertificationChecker.isPhotoCertified(USER_ID, SESSION_ID)).thenReturn(true);

        ReadingSessionRewardResult result = service.grant(USER_ID, SESSION_ID);

        assertThat(result.photoBonus()).isEqualTo(new ReadingSessionRewardResult.PhotoBonus(true, 20, 0));
        verify(rewardLedger).addExperienceFor(account, 20, TransactionReason.PHOTO_CERTIFICATION, SESSION_ID);
    }

    @Test
    void 추가_보상은_세션당_한_번만_지급한다() {
        alreadyBaseGranted();
        when(photoCertificationChecker.isPhotoCertified(USER_ID, SESSION_ID)).thenReturn(true);
        when(rewardLedger.isExperienceGranted(USER_ID, TransactionReason.PHOTO_CERTIFICATION, SESSION_ID)).thenReturn(true);

        ReadingSessionRewardResult result = service.grant(USER_ID, SESSION_ID);

        assertThat(result.photoBonus().granted()).isFalse();
        verify(rewardLedger, never()).addExperienceFor(any(), anyInt(), eq(TransactionReason.PHOTO_CERTIFICATION), any());
    }

    @Test
    void 사진_인증_조회가_실패해도_기본_보상은_지급하고_추가_보상만_빠진다() {
        baseNotGrantedYet();
        when(rewardService.grantReadingExperience(USER_ID, session))
                .thenReturn(new ReadingRewardResult(34, false, 0, 1));
        when(questService.recordReadingSession(USER_ID, 1800, READING_DATE))
                .thenReturn(new QuestSessionResult(List.of(), List.of()));
        when(photoCertificationChecker.isPhotoCertified(USER_ID, SESSION_ID))
                .thenThrow(new IllegalStateException("BE1 조회 실패"));

        ReadingSessionRewardResult result = service.grant(USER_ID, SESSION_ID);

        assertThat(result.baseGranted()).isTrue();
        assertThat(result.reading().experience()).isEqualTo(34);
        assertThat(result.photoBonus().granted()).isFalse();
    }

    @Test
    void 다른_사용자의_세션이거나_없는_세션이면_REWARD_005() {
        when(readingSessionReader.findOwnSession(USER_ID, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.grant(USER_ID, 999L))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.READING_SESSION_NOT_FOUND);
    }

    private void baseNotGrantedYet() {
        when(rewardLedger.isExperienceGranted(USER_ID, TransactionReason.READING_COMPLETE, SESSION_ID)).thenReturn(false);
    }

    private void alreadyBaseGranted() {
        when(rewardLedger.isExperienceGranted(USER_ID, TransactionReason.READING_COMPLETE, SESSION_ID)).thenReturn(true);
    }
}
