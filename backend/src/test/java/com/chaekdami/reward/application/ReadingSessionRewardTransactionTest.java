package com.chaekdami.reward.application;

import com.chaekdami.dday.application.DdayService;
import com.chaekdami.reading.application.CertificationService;
import com.chaekdami.reading.application.CertificationVerifier;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ai.PageTextExtractor;
import com.chaekdami.reward.application.port.ReadingSessionReader;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.StreakCalculator;
import com.chaekdami.reward.infrastructure.CertificationPhotoChecker;
import com.chaekdami.reward.infrastructure.ReadingSessionRewardRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.SmartTransactionObject;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 독서 완료 보상과 사진 인증 조회의 트랜잭션 경계를 확인한다. (ISSUE-BUG-26)
 * Spring 트랜잭션 프록시는 실제로 쓰고, DB 없이 커밋/롤백만 기록하는 트랜잭션 매니저를 쓴다.
 */
class ReadingSessionRewardTransactionTest {

    private static final Long USER_ID = 1L;
    private static final Long SESSION_ID = 42L;

    private final RecordingTransactionManager transactionManager = new RecordingTransactionManager();
    private final CertificationRepository certificationRepository = mock(CertificationRepository.class);
    private final RewardLedger rewardLedger = mock(RewardLedger.class);
    private final RewardService rewardService = mock(RewardService.class);
    private AnnotationConfigApplicationContext context;
    private ReadingSessionRewardService service;

    @BeforeEach
    void setUp() {
        ReadingSessionReader.Session session = new ReadingSessionReader.Session(
                SESSION_ID, 1800, 30, 52, LocalDateTime.of(2026, 11, 17, 23, 58));
        ReadingSessionReader sessionReader = mock(ReadingSessionReader.class);
        QuestService questService = mock(QuestService.class);
        StreakService streakService = mock(StreakService.class);
        ReadingSessionRewardRepository rewardRepository = mock(ReadingSessionRewardRepository.class);
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(RewardAccount.builder().userId(USER_ID).build());
        when(sessionReader.findOwnSession(USER_ID, SESSION_ID)).thenReturn(Optional.of(session));
        when(rewardService.grantReadingExperience(USER_ID, session))
                .thenReturn(new ReadingRewardResult(34, false, 0, 1));
        when(questService.recordReadingSession(eq(USER_ID), anyInt(), any()))
                .thenReturn(new QuestSessionResult(List.of(), List.of()));
        when(streakService.summarize(eq(USER_ID), any())).thenReturn(new StreakCalculator.Summary(3, 5));
        when(rewardRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        context = new AnnotationConfigApplicationContext();
        context.register(TransactionConfig.class);
        context.registerBean(PlatformTransactionManager.class, () -> transactionManager);
        context.registerBean(TransactionTemplate.class, () -> new TransactionTemplate(transactionManager));
        context.registerBean(RewardLedger.class, () -> rewardLedger);
        context.registerBean(RewardService.class, () -> rewardService);
        context.registerBean(QuestService.class, () -> questService);
        context.registerBean(DdayService.class, () -> mock(DdayService.class));
        context.registerBean(StreakService.class, () -> streakService);
        context.registerBean(ReadingSessionReader.class, () -> sessionReader);
        context.registerBean(ReadingSessionRewardRepository.class, () -> rewardRepository);
        context.registerBean(CertificationService.class, () -> new CertificationService(
                mock(ReadingRecordRepository.class), certificationRepository,
                mock(PageTextExtractor.class), new CertificationVerifier()));
        context.registerBean(CertificationPhotoChecker.class);
        context.registerBean(ReadingSessionRewardService.class);
        context.refresh();
        service = context.getBean(ReadingSessionRewardService.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void 사진_인증_조회가_DB_오류로_실패해도_기본_보상은_커밋된다() {
        when(certificationRepository.findByUserIdAndReadingSessionId(USER_ID, SESSION_ID))
                .thenThrow(new DataAccessResourceFailureException("DB 오류"));

        ReadingSessionRewardResult result = service.grant(USER_ID, SESSION_ID);

        assertThat(result.baseGranted()).isTrue();
        assertThat(result.photoBonus().granted()).isFalse();
        // 실패한 조회 트랜잭션만 롤백되고, 이어서 시작한 보상 트랜잭션은 커밋된다.
        assertThat(transactionManager.events).containsExactly("begin", "rollback", "begin", "commit");
    }

    @Test
    void 사진_인증_조회를_끝낸_뒤에_보상_트랜잭션을_시작한다() {
        when(certificationRepository.findByUserIdAndReadingSessionId(USER_ID, SESSION_ID))
                .thenReturn(Optional.empty());

        service.grant(USER_ID, SESSION_ID);

        assertThat(transactionManager.events).containsExactly("begin", "commit", "begin", "commit");
    }

    @Test
    void 보상_지급이_실패하면_보상_트랜잭션은_롤백된다() {
        when(certificationRepository.findByUserIdAndReadingSessionId(USER_ID, SESSION_ID))
                .thenReturn(Optional.empty());
        when(rewardService.grantReadingExperience(any(), any())).thenThrow(new IllegalStateException("지급 실패"));

        assertThatThrownBy(() -> service.grant(USER_ID, SESSION_ID)).isInstanceOf(IllegalStateException.class);

        assertThat(transactionManager.events).containsExactly("begin", "commit", "begin", "rollback");
    }

    @Configuration
    @EnableTransactionManagement(proxyTargetClass = true)
    static class TransactionConfig {
    }

    /** 커밋과 롤백만 기록한다. 참여한 트랜잭션이 실패하면 실제 매니저처럼 전체를 롤백 전용으로 표시한다. */
    private static class RecordingTransactionManager extends AbstractPlatformTransactionManager {

        private final transient List<String> events = new ArrayList<>();
        private transient Tx current;

        @Override
        protected Object doGetTransaction() {
            return current != null ? current : new Tx();
        }

        @Override
        protected boolean isExistingTransaction(Object transaction) {
            return current != null;
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
            current = (Tx) transaction;
            events.add("begin");
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
            events.add("commit");
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
            events.add("rollback");
        }

        @Override
        protected void doSetRollbackOnly(DefaultTransactionStatus status) {
            current.rollbackOnly = true;
        }

        @Override
        protected void doCleanupAfterCompletion(Object transaction) {
            current = null;
        }
    }

    private static class Tx implements SmartTransactionObject {

        private boolean rollbackOnly;

        @Override
        public boolean isRollbackOnly() {
            return rollbackOnly;
        }

        @Override
        public void flush() {
            // DB 가 없어 내보낼 변경이 없다.
        }
    }
}
