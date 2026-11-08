package com.chaekdami.review.application.result;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 완독한 회차 하나. 비공개인 쪽은 null이다.
 */
public record CommunityEntrySummary(Long readingRecordId, int round, LocalDateTime completedAt,
                                    CommunityAuthor author, boolean isMine,
                                    SentenceCollectionPreview sentenceCollection,
                                    BookReportPreview bookReport) {

    public record SentenceCollectionPreview(long sentenceCount, List<PreviewSentence> previewSentences) {
    }

    public record PreviewSentence(Long sentenceId, String content, Integer pageNumber) {
    }

    public record BookReportPreview(Long bookReportId, String preview, int length) {
    }
}
