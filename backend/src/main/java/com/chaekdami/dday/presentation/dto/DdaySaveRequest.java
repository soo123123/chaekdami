package com.chaekdami.dday.presentation.dto;

import java.util.List;
import java.util.Map;

public record DdaySaveRequest(
        List<DdayGoalRequest> goals,
        Map<String, String> records
) {
}
