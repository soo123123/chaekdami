package com.chaekdami.dday.presentation.dto;

import com.chaekdami.dday.domain.DdayGoal;

import java.time.LocalDate;

public record DdayGoalResponse(
        Long id,
        String title,
        LocalDate targetDate,
        int targetBooks,
        int completedBooks
) {

    public static DdayGoalResponse from(DdayGoal goal) {
        return new DdayGoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getTargetDate(),
                goal.getTargetBooks(),
                goal.getCompletedBooks()
        );
    }
}
