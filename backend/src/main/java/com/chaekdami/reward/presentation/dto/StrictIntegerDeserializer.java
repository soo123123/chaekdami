package com.chaekdami.reward.presentation.dto;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

/**
 * JSON 정수만 받는다. 기본 설정은 소수(2.7)를 잘라 2로, 문자열("2")을 2로 바꾸지만, 개수 비교에 쓰는 값은 그대로 받으면 안 된다.
 * 소수·문자열·정수 범위를 넘는 값은 요청 본문을 읽을 수 없는 것으로 보아 400 VALIDATION_ERROR 가 된다. (ISSUE-BUG-36)
 * null 은 이 클래스를 거치지 않고 null 로 들어온다.
 */
public class StrictIntegerDeserializer extends ValueDeserializer<Integer> {

    @Override
    public Integer deserialize(JsonParser parser, DeserializationContext context) throws JacksonException {
        if (!parser.isExpectedNumberIntToken()) {
            return (Integer) context.handleUnexpectedToken(Integer.class, parser);
        }
        return parser.getIntValue();
    }
}
