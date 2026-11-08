package com.chaekdami.review.presentation;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.review.application.CommunityService;
import com.chaekdami.review.application.result.CommunityEntryDetail;
import com.chaekdami.review.application.result.CommunityEntrySummary;
import com.chaekdami.review.application.result.CommunitySummary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping("/api/books/{bookId}/community")
    public ResponseEntity<CommunitySummary> summary(@PathVariable Long bookId) {
        return ResponseEntity.ok(communityService.summary(bookId));
    }

    @GetMapping("/api/books/{bookId}/community/entries")
    public ResponseEntity<PageResponse<CommunityEntrySummary>> entries(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(communityService.entries(bookId, page, size));
    }

    @GetMapping("/api/books/{bookId}/community/entries/{readingRecordId}")
    public ResponseEntity<CommunityEntryDetail> entry(@PathVariable Long bookId,
                                                      @PathVariable Long readingRecordId) {
        return ResponseEntity.ok(communityService.entry(bookId, readingRecordId));
    }
}
