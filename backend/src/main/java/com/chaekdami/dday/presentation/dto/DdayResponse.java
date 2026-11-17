package com.chaekdami.dday.presentation.dto;

import java.util.List;
import java.util.Map;

public record DdayResponse(
        List<DdayGoalResponse> goals,
        Map<String, String> records
) {
}
