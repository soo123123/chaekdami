package com.chaekdami.review.presentation;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.review.application.ReviewAdminService;
import com.chaekdami.review.application.result.AdminReviewResult;
import com.chaekdami.review.presentation.dto.BlindRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReviewAdminController {

    private final ReviewAdminService reviewAdminService;

    @GetMapping("/api/admin/reviews/reported")
    public ResponseEntity<PageResponse<AdminReviewResult>> reported(
            @RequestParam(required = false) Boolean blinded,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reviewAdminService.reported(blinded, page, size));
    }

    @PatchMapping("/api/admin/reviews/{reviewId}/blind")
    public ResponseEntity<AdminReviewResult> changeBlind(@PathVariable Long reviewId,
                                                         @RequestBody @Valid BlindRequest request) {
        return ResponseEntity.ok(reviewAdminService.changeBlind(reviewId, request.getBlinded()));
    }
}
