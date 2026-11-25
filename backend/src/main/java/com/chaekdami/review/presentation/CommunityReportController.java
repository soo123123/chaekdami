package com.chaekdami.review.presentation;

import com.chaekdami.review.application.CommunityReportService;
import com.chaekdami.review.presentation.dto.ReviewReportRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CommunityReportController {

    private final CommunityReportService communityReportService;

    @PostMapping("/api/book-reports/{bookReportId}/reports")
    public ResponseEntity<Void> reportBookReport(@PathVariable Long bookReportId,
                                                 @RequestBody @Valid ReviewReportRequest request) {
        communityReportService.reportBookReport(bookReportId, request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/api/sentences/{sentenceId}/reports")
    public ResponseEntity<Void> reportSentence(@PathVariable Long sentenceId,
                                               @RequestBody @Valid ReviewReportRequest request) {
        communityReportService.reportSentence(sentenceId, request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
