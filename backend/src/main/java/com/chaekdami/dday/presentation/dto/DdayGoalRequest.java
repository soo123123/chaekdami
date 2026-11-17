package com.chaekdami.dday.presentation.dto;

import java.time.LocalDate;

public record DdayGoalRequest(
        Long id,
        String title,
        LocalDate targetDate,
        Integer targetBooks,
        Integer completedBooks
) {
}
