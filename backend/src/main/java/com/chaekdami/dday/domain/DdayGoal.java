package com.chaekdami.dday.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "dday_goals", indexes = @Index(name = "idx_dday_goals_user_id", columnList = "user_id"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DdayGoal extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "target_books", nullable = false)
    private Integer targetBooks;

    @Column(name = "completed_books", nullable = false)
    private Integer completedBooks;

    public static DdayGoal create(Long userId, String title, LocalDate targetDate, int targetBooks, int completedBooks) {
        DdayGoal goal = new DdayGoal();
        goal.userId = userId;
        goal.change(title, targetDate, targetBooks, completedBooks);
        return goal;
    }

    public void change(String title, LocalDate targetDate, int targetBooks, int completedBooks) {
        this.title = title;
        this.targetDate = targetDate;
        this.targetBooks = targetBooks;
        this.completedBooks = completedBooks;
    }
}
