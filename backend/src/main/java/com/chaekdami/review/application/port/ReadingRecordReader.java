package com.chaekdami.review.application.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReadingRecordReader {

    Optional<ReadingRecordView> find(Long readingRecordId);

    List<ReadingRecordView> findAll(Collection<Long> readingRecordIds);

    boolean hasCompletedRound(Long bookId);

    boolean hasCompletedRoundByIsbn(Long userId, String isbn);
}
