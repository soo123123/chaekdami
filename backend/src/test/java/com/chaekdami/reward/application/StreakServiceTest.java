package com.chaekdami.reward.application;

import com.chaekdami.dday.domain.DdayRecord;
import com.chaekdami.dday.domain.DdayRecordStatus;
import com.chaekdami.dday.infrastructure.DdayRecordRepository;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    private static final Long USER_ID = 1L;
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 19);

    @Mock
    private DdayRecordRepository ddayRecordRepository;
    @Mock
    private UserItemRepository userItemRepository;
    @Mock
    private RewardLedger rewardLedger;
    @InjectMocks
    private StreakService streakService;

    @Test
    void 놓친_날마다_방어권_1개를_쓰고_달력에_방어로_기록한다() {
        records(TODAY.minusDays(4), DdayRecordStatus.READ, TODAY.minusDays(3), DdayRecordStatus.READ);
        UserItem shield = shieldStock(5);

        int used = streakService.settleBefore(USER_ID, TODAY);   // 그제, 어제를 놓침

        assertThat(used).isEqualTo(2);
        assertThat(shield.getQuantity()).isEqualTo(3);
        assertThat(savedProtectedDates()).containsExactly(TODAY.minusDays(2), TODAY.minusDays(1));
    }

    @Test
    void 방어권이_모자라면_거기서_멈춘다() {
        records(TODAY.minusDays(4), DdayRecordStatus.READ);
        UserItem shield = shieldStock(1);

        int used = streakService.settleBefore(USER_ID, TODAY);   // 3일 놓침, 방어권 1개

        assertThat(used).isEqualTo(1);
        assertThat(shield.getQuantity()).isZero();
        assertThat(savedProtectedDates()).containsExactly(TODAY.minusDays(3));
    }

    @Test
    void 연속_일수가_0이면_방어권을_쓰지_않는다() {
        records(TODAY.minusDays(9), DdayRecordStatus.READ, TODAY.minusDays(5), DdayRecordStatus.PROTECTED);

        int used = streakService.settleBefore(USER_ID, TODAY);

        assertThat(used).isZero();
        verify(userItemRepository, never()).findAllInStockByUserIdAndItemType(any(), any());
        verify(ddayRecordRepository, never()).save(any());
    }

    @Test
    void 어제까지_기록이_있으면_정산할_게_없어_잠그지도_않는다() {
        records(TODAY.minusDays(1), DdayRecordStatus.READ);

        assertThat(streakService.settleBefore(USER_ID, TODAY)).isZero();
        verify(rewardLedger, never()).lockAccount(any());
    }

    @Test
    void 기록이_없는_사용자는_정산하지_않는다() {
        when(ddayRecordRepository.findAllByUserIdOrderByRecordDateAsc(USER_ID)).thenReturn(List.of());

        assertThat(streakService.settleBefore(USER_ID, TODAY)).isZero();
        verify(rewardLedger, never()).lockAccount(any());
    }

    @Test
    void 방어로_막혀_있던_날을_읽음으로_바꿀_때_방어권_1개를_돌려준다() {
        DdayRecord protectedDay = DdayRecord.create(USER_ID, TODAY.minusDays(2), DdayRecordStatus.PROTECTED);
        when(ddayRecordRepository.findByUserIdAndRecordDate(USER_ID, TODAY.minusDays(2)))
                .thenReturn(Optional.of(protectedDay));
        UserItem shield = UserItem.builder().userId(USER_ID).shopItemId(10L).quantity(0).build();
        when(userItemRepository.findAllByUserIdAndItemType(USER_ID, ShopItemType.SHIELD)).thenReturn(List.of(shield));

        boolean refunded = streakService.refundShieldIfProtected(USER_ID, TODAY.minusDays(2));

        assertThat(refunded).isTrue();
        assertThat(shield.getQuantity()).isEqualTo(1);
        verify(rewardLedger).lockAccount(USER_ID);
    }

    @Test
    void 읽음이거나_기록이_없는_날은_돌려주지_않는다() {
        when(ddayRecordRepository.findByUserIdAndRecordDate(USER_ID, TODAY.minusDays(1)))
                .thenReturn(Optional.of(DdayRecord.create(USER_ID, TODAY.minusDays(1), DdayRecordStatus.READ)));
        when(ddayRecordRepository.findByUserIdAndRecordDate(USER_ID, TODAY)).thenReturn(Optional.empty());

        assertThat(streakService.refundShieldIfProtected(USER_ID, TODAY.minusDays(1))).isFalse();
        assertThat(streakService.refundShieldIfProtected(USER_ID, TODAY)).isFalse();
        verify(rewardLedger, never()).lockAccount(any());
        verify(userItemRepository, never()).findAllByUserIdAndItemType(any(), any());
    }

    @Test
    void 연속_일수는_달력으로_계산한다() {
        records(TODAY.minusDays(2), DdayRecordStatus.READ,
                TODAY.minusDays(1), DdayRecordStatus.PROTECTED,
                TODAY, DdayRecordStatus.READ);

        assertThat(streakService.summarize(USER_ID, TODAY).currentStreak()).isEqualTo(2);
    }

    private void records(Object... dateAndStatus) {
        List<DdayRecord> records = new ArrayList<>();
        for (int i = 0; i < dateAndStatus.length; i += 2) {
            records.add(DdayRecord.create(USER_ID, (LocalDate) dateAndStatus[i], (DdayRecordStatus) dateAndStatus[i + 1]));
        }
        when(ddayRecordRepository.findAllByUserIdOrderByRecordDateAsc(USER_ID)).thenReturn(records);
    }

    private UserItem shieldStock(int quantity) {
        UserItem shield = UserItem.builder().userId(USER_ID).shopItemId(10L).quantity(quantity).build();
        when(userItemRepository.findAllInStockByUserIdAndItemType(USER_ID, ShopItemType.SHIELD))
                .thenReturn(List.of(shield));
        return shield;
    }

    private List<LocalDate> savedProtectedDates() {
        ArgumentCaptor<DdayRecord> saved = ArgumentCaptor.forClass(DdayRecord.class);
        verify(ddayRecordRepository, atLeastOnce()).save(saved.capture());
        assertThat(saved.getAllValues()).allSatisfy(
                record -> assertThat(record.getStatus()).isEqualTo(DdayRecordStatus.PROTECTED));
        return saved.getAllValues().stream().map(DdayRecord::getRecordDate).toList();
    }
}
