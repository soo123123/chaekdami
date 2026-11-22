package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.CertificationStatus;
import com.chaekdami.reading.infrastructure.ai.PageExtraction;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// 독서 인증 판정 규칙 (억울하게 실패하지 않도록 느슨하게)
// - 실패(FAILED): 책 페이지가 아니라고 AI가 확실히 판단 / 이전 인증과 거의 같은 사진
// - 확인 불가(UNVERIFIED): 읽은 글자가 너무 적음 / 페이지 번호가 읽은 범위에서 많이 벗어남
// - 통과(PASSED): 그 외 (페이지 번호를 못 찾거나 문장을 못 찾는 건 안내 메시지만 남김)
@Component
public class CertificationVerifier {

    static final int MIN_TEXT_LENGTH = 20;          // 이보다 적게 읽히면 판단 보류
    static final int PAGE_MARGIN = 3;               // 페이지 번호 허용 오차 (±3쪽)
    static final double DUPLICATE_SIMILARITY = 0.9; // 이 이상 비슷하면 같은 사진으로 봄
    static final double SENTENCE_MATCH = 0.6;       // 문장 글자 조각의 60% 이상이 사진에 있으면 찾은 것으로 봄
    static final String AI_SKIPPED_MESSAGE = "AI 확인 없이 통과했어요. (사용 한도 초과)";

    public record Result(
            CertificationStatus status,
            String normalizedText,
            Boolean sentenceFound,   // 문장을 보내지 않았으면 null
            List<String> messages
    ) {}

    public Result verify(PageExtraction extraction, Integer startPage, Integer endPage,
                         String sentence, List<String> previousNormalizedTexts) {
        // AI 사용 한도 초과(429)로 사진을 확인하지 못함: 임시 API라 다른 검사 없이 통과 (보상은 주지 않음)
        if (extraction.aiSkipped()) {
            return new Result(CertificationStatus.PASSED, "", null, List.of(AI_SKIPPED_MESSAGE));
        }

        List<String> fails = new ArrayList<>();
        List<String> unverified = new ArrayList<>();
        List<String> notes = new ArrayList<>();

        String text = extraction.text() == null ? "" : extraction.text();
        String normalized = normalize(text);

        // ① 책 페이지 사진인가 (AI가 "아니다"라고 확실히 말한 경우에만 실패)
        if (Boolean.FALSE.equals(extraction.isBookPage())) {
            fails.add("책 페이지 사진이 아닌 것 같아요. 글자가 보이게 다시 찍어주세요.");
        }

        // 글자가 너무 적으면 나머지 비교를 할 수 없음
        if (normalized.length() < MIN_TEXT_LENGTH) {
            unverified.add("사진에서 글자를 충분히 읽지 못했어요. 밝은 곳에서 페이지 전체가 보이게 찍어주세요.");
        }

        // ② 페이지 번호가 읽은 범위 안인가 (±3쪽 여유, 못 찾으면 통과)
        Integer page = extraction.pageNumber();
        if (page == null) {
            notes.add("페이지 번호는 확인하지 못했어요.");
        } else if (startPage != null && endPage != null) {
            int low = Math.min(startPage, endPage) - PAGE_MARGIN;
            int high = Math.max(startPage, endPage) + PAGE_MARGIN;
            if (page < low || page > high) {
                unverified.add("사진의 페이지(" + page + "쪽)가 이번에 읽은 범위(" + startPage + "~" + endPage + "쪽)와 달라요.");
            }
        }

        // ③ 같은 사진 재사용 (글자가 충분할 때만 비교)
        if (normalized.length() >= MIN_TEXT_LENGTH) {
            for (String previous : previousNormalizedTexts) {
                if (previous != null && previous.length() >= MIN_TEXT_LENGTH
                        && similarity(normalized, previous) >= DUPLICATE_SIMILARITY) {
                    fails.add("이전에 인증한 사진과 같은 페이지예요. 새로 읽은 페이지를 찍어주세요.");
                    break;
                }
            }
        }

        // ④ 고른 문장이 사진에 있나 (판정에는 영향 없음, 결과만 알려줌)
        Boolean sentenceFound = null;
        if (sentence != null && !normalize(sentence).isEmpty()) {
            sentenceFound = containsLoosely(normalized, normalize(sentence));
            if (!sentenceFound) {
                notes.add("입력한 문장을 사진에서 찾지 못했어요.");
            }
        }

        CertificationStatus status = !fails.isEmpty() ? CertificationStatus.FAILED
                : !unverified.isEmpty() ? CertificationStatus.UNVERIFIED
                : CertificationStatus.PASSED;

        List<String> messages = new ArrayList<>();
        messages.addAll(fails);
        messages.addAll(unverified);
        messages.addAll(notes);
        return new Result(status, normalized, sentenceFound, messages);
    }

    // 소문자로 바꾸고 글자·숫자만 남김 (띄어쓰기, 줄바꿈, 문장부호 차이 무시)
    static String normalize(String s) {
        if (s == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        s.toLowerCase().codePoints()
                .filter(Character::isLetterOrDigit)
                .forEach(sb::appendCodePoint);
        return sb.toString();
    }

    // 두 글의 3글자 조각 겹침 비율 (0~1)
    static double similarity(String a, String b) {
        Set<String> ga = grams(a);
        Set<String> gb = grams(b);
        if (ga.isEmpty() || gb.isEmpty()) {
            return 0;
        }
        Set<String> inter = new HashSet<>(ga);
        inter.retainAll(gb);
        Set<String> union = new HashSet<>(ga);
        union.addAll(gb);
        return (double) inter.size() / union.size();
    }

    // 문장이 글 안에 있는가 (그대로 포함되거나, 문장 조각의 60% 이상이 글에 있으면 찾은 것으로 봄)
    static boolean containsLoosely(String text, String sentence) {
        if (text.contains(sentence)) {
            return true;
        }
        Set<String> gs = grams(sentence);
        if (gs.isEmpty()) {
            return false;
        }
        Set<String> gt = grams(text);
        long hit = gs.stream().filter(gt::contains).count();
        return (double) hit / gs.size() >= SENTENCE_MATCH;
    }

    private static Set<String> grams(String s) {
        Set<String> set = new HashSet<>();
        int[] cps = s.codePoints().toArray();
        for (int i = 0; i + 3 <= cps.length; i++) {
            set.add(new String(cps, i, 3));
        }
        return set;
    }
}
