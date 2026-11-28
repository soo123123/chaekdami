package com.chaekdami.reminder.presentation;

import com.chaekdami.reminder.application.ReminderSettingService;
import com.chaekdami.reminder.application.ReminderStatusService;
import com.chaekdami.reminder.application.result.ReminderSettingResult;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.presentation.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 알림 설정 저장 요청의 검증 (스펙 014 R4.5). 서비스는 mock 이라 DB 없이 돈다.
 */
@ExtendWith(MockitoExtension.class)
class ReminderControllerTest {

    @Mock
    private CurrentUser currentUser;
    @Mock
    private ReminderStatusService reminderStatusService;
    @Mock
    private ReminderSettingService reminderSettingService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new ReminderController(currentUser, reminderStatusService, reminderSettingService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void 설정을_저장하고_저장된_값을_돌려준다() throws Exception {
        when(currentUser.requireId()).thenReturn(3L);
        when(reminderSettingService.save(3L, true, true, 240)).thenReturn(new ReminderSettingResult(true, true, 240));

        mockMvc.perform(put("/api/me/reminder-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"enabled": true, "earlyLateMuted": true, "weeklyGoalMinutes": 240}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.earlyLateMuted").value(true))
                .andExpect(jsonPath("$.weeklyGoalMinutes").value(240));
    }

    @Test
    void 주간_목표가_30분_미만이면_400이고_저장하지_않는다() throws Exception {
        mockMvc.perform(put("/api/me/reminder-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"enabled": true, "earlyLateMuted": false, "weeklyGoalMinutes": 20}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields[0].field").value("weeklyGoalMinutes"));

        verify(reminderSettingService, never()).save(anyLong(), anyBoolean(), anyBoolean(), anyInt());
    }

    @Test
    void 값이_빠지면_400이다() throws Exception {
        mockMvc.perform(put("/api/me/reminder-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"enabled": true, "weeklyGoalMinutes": 300}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
