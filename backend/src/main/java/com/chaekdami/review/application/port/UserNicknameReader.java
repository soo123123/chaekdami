package com.chaekdami.review.application.port;

import java.util.Collection;
import java.util.Map;

public interface UserNicknameReader {

    Map<Long, String> findNicknames(Collection<Long> userIds);
}
