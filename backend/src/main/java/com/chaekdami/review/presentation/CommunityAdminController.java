package com.chaekdami.review.presentation;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.review.application.CommunityAdminService;
import com.chaekdami.review.application.result.AdminBookReportResult;
import com.chaekdami.review.application.result.AdminSentenceResult;
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
public class CommunityAdminController {

    private final CommunityAdminService communityAdminService;

    @GetMapping("/api/admin/book-reports/reported")
    public ResponseEntity<PageResponse<AdminBookReportResult>> reportedBookReports(
            @RequestParam(required = false) Boolean blinded,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(communityAdminService.reportedBookReports(blinded, page, size));
    }

    @PatchMapping("/api/admin/book-reports/{bookReportId}/blind")
    public ResponseEntity<AdminBookReportResult> changeBookReportBlind(@PathVariable Long bookReportId,
                                                                       @RequestBody @Valid BlindRequest request) {
        return ResponseEntity.ok(
                communityAdminService.changeBookReportBlind(bookReportId, request.getBlinded()));
    }

    @GetMapping("/api/admin/sentences/reported")
    public ResponseEntity<PageResponse<AdminSentenceResult>> reportedSentences(
            @RequestParam(required = false) Boolean blinded,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(communityAdminService.reportedSentences(blinded, page, size));
    }

    @PatchMapping("/api/admin/sentences/{sentenceId}/blind")
    public ResponseEntity<AdminSentenceResult> changeSentenceBlind(@PathVariable Long sentenceId,
                                                                   @RequestBody @Valid BlindRequest request) {
        return ResponseEntity.ok(communityAdminService.changeSentenceBlind(sentenceId, request.getBlinded()));
    }
}
