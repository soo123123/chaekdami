package com.chaekdami.review.presentation;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.review.application.ReadingReviewService;
import com.chaekdami.review.application.ReviewService;
import com.chaekdami.review.application.ReviewSocialService;
import com.chaekdami.review.application.result.LikeResult;
import com.chaekdami.review.application.result.PublicReviewResult;
import com.chaekdami.review.application.result.RatingSummary;
import com.chaekdami.review.presentation.dto.ReadingReviewRequest;
import com.chaekdami.review.presentation.dto.ReadingReviewResponse;
import com.chaekdami.review.presentation.dto.ReviewReportRequest;
import com.chaekdami.review.presentation.dto.ReviewResponse;
import com.chaekdami.review.presentation.dto.ReviewWriteRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final ReadingReviewService readingReviewService;
    private final ReviewSocialService reviewSocialService;

    @PostMapping("/api/books/{bookId}/review")
    public ResponseEntity<ReviewResponse> create(@PathVariable Long bookId,
                                                 @RequestBody ReviewWriteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ReviewResponse.from(reviewService.create(bookId, request.toCommand())));
    }

    @GetMapping("/api/books/{bookId}/review")
    public ResponseEntity<ReviewResponse> getMine(@PathVariable Long bookId) {
        return ResponseEntity.ok(ReviewResponse.from(reviewService.getMine(bookId)));
    }

    @PatchMapping("/api/reviews/{reviewId}")
    public ResponseEntity<ReviewResponse> update(@PathVariable Long reviewId,
                                                 @RequestBody ReviewWriteRequest request) {
        return ResponseEntity.ok(ReviewResponse.from(reviewService.update(reviewId, request.toCommand())));
    }

    @GetMapping("/api/reading-records/{readingRecordId}/review")
    public ResponseEntity<ReadingReviewResponse> getForRound(@PathVariable Long readingRecordId) {
        return ResponseEntity.ok(ReadingReviewResponse.from(readingReviewService.get(readingRecordId)));
    }

    @PutMapping("/api/reading-records/{readingRecordId}/review")
    public ResponseEntity<ReadingReviewResponse> putForRound(@PathVariable Long readingRecordId,
                                                             @RequestBody ReadingReviewRequest request) {
        return ResponseEntity.ok(ReadingReviewResponse.from(
                readingReviewService.put(readingRecordId, request.toCommand())));
    }

    @GetMapping("/api/reviews")
    public ResponseEntity<PageResponse<PublicReviewResult>> publicReviews(
            @RequestParam String isbn,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reviewSocialService.publicReviews(isbn, sort, page, size));
    }

    @GetMapping("/api/reviews/rating-summary")
    public ResponseEntity<RatingSummary> ratingSummary(@RequestParam String isbn) {
        return ResponseEntity.ok(reviewSocialService.ratingSummary(isbn));
    }

    @PutMapping("/api/reviews/{reviewId}/like")
    public ResponseEntity<LikeResult> like(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewSocialService.like(reviewId));
    }

    @DeleteMapping("/api/reviews/{reviewId}/like")
    public ResponseEntity<LikeResult> unlike(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewSocialService.unlike(reviewId));
    }

    @PostMapping("/api/reviews/{reviewId}/reports")
    public ResponseEntity<Void> report(@PathVariable Long reviewId,
                                       @RequestBody @Valid ReviewReportRequest request) {
        reviewSocialService.report(reviewId, request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
