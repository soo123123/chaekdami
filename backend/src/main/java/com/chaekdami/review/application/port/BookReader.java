package com.chaekdami.review.application.port;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

public interface BookReader {

    Optional<BookView> find(Long bookId);

    Map<Long, BookView> findAll(Collection<Long> bookIds);
}
