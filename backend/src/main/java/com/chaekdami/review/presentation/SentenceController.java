package com.chaekdami.review.presentation;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.review.application.SentenceCollectionService;
import com.chaekdami.review.application.SentenceService;
import com.chaekdami.review.application.command.SentenceCreateCommand;
import com.chaekdami.review.application.command.SentenceUpdateCommand;
import com.chaekdami.review.presentation.dto.SentenceCollectionCardResponse;
import com.chaekdami.review.presentation.dto.SentenceCollectionResponse;
import com.chaekdami.review.presentation.dto.SentenceCreateRequest;
import com.chaekdami.review.presentation.dto.SentenceResponse;
import com.chaekdami.review.presentation.dto.SentenceUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class SentenceController {

    private final SentenceService sentenceService;
    private final SentenceCollectionService sentenceCollectionService;

    @PostMapping("/api/reading-records/{readingRecordId}/sentences")
    public ResponseEntity<SentenceResponse> create(@PathVariable Long readingRecordId,
                                                   @RequestBody @Valid SentenceCreateRequest request) {
        var result = sentenceService.create(readingRecordId,
                new SentenceCreateCommand(request.getContent(), request.getPageNumber()));
        return ResponseEntity.status(HttpStatus.CREATED).body(SentenceResponse.from(result));
    }

    @GetMapping("/api/reading-records/{readingRecordId}/sentences")
    public ResponseEntity<List<SentenceResponse>> list(@PathVariable Long readingRecordId) {
        return ResponseEntity.ok(sentenceService.list(readingRecordId).stream()
                .map(SentenceResponse::from)
                .toList());
    }

    @PatchMapping("/api/sentences/{sentenceId}")
    public ResponseEntity<SentenceResponse> update(@PathVariable Long sentenceId,
                                                   @RequestBody SentenceUpdateRequest request) {
        var result = sentenceService.update(sentenceId, new SentenceUpdateCommand(
                request.getContent(), request.isPageNumberPresent(), request.getPageNumber()));
        return ResponseEntity.ok(SentenceResponse.from(result));
    }

    @DeleteMapping("/api/sentences/{sentenceId}")
    public ResponseEntity<Void> delete(@PathVariable Long sentenceId) {
        sentenceService.delete(sentenceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/reading-records/{readingRecordId}/sentence-collection")
    public ResponseEntity<SentenceCollectionResponse> collection(@PathVariable Long readingRecordId) {
        return ResponseEntity.ok(SentenceCollectionResponse.from(sentenceCollectionService.get(readingRecordId)));
    }

    @GetMapping("/api/me/sentence-collections")
    public ResponseEntity<PageResponse<SentenceCollectionCardResponse>> myCollections(
            @RequestParam(required = false) Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(sentenceCollectionService.listMine(bookId, page, size)
                .map(SentenceCollectionCardResponse::from));
    }
}
