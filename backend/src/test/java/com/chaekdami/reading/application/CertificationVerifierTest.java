package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.CertificationStatus;
import com.chaekdami.reading.infrastructure.ai.PageExtraction;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CertificationVerifierTest {

    private final CertificationVerifier verifier = new CertificationVerifier();

    private static final String PAGE_TEXT = "새는 알에서 나오려고 투쟁한다. 알은 세계이다. 태어나려는 자는 하나의 세계를 깨뜨려야 한다.";

    @Test
    void AI_확인_안_함_429면_다른_검사_없이_통과하고_안내를_남긴다() {
        CertificationVerifier.Result result = verifier.verify(PageExtraction.skipped(), 10, 20, "문장", List.of());

        assertThat(result.status()).isEqualTo(CertificationStatus.PASSED);
        assertThat(result.messages()).containsExactly(CertificationVerifier.AI_SKIPPED_MESSAGE);
        assertThat(result.normalizedText()).isEmpty();
        assertThat(result.sentenceFound()).isNull();
    }

    @Test
    void AI_확인_안_함이면_이전_인증과_비교하지_않는다() {
        String previous = CertificationVerifier.normalize(PAGE_TEXT);

        CertificationVerifier.Result result = verifier.verify(PageExtraction.skipped(), null, null, null, List.of(previous));

        assertThat(result.status()).isEqualTo(CertificationStatus.PASSED);
    }

    @Test
    void AI가_빈_결과를_주면_지금처럼_확인_불가() {
        CertificationVerifier.Result result = verifier.verify(new PageExtraction("", null, null), null, null, null, List.of());

        assertThat(result.status()).isEqualTo(CertificationStatus.UNVERIFIED);
        assertThat(result.messages()).doesNotContain(CertificationVerifier.AI_SKIPPED_MESSAGE);
    }

    @Test
    void AI가_읽은_결과는_지금_규칙대로_통과() {
        CertificationVerifier.Result result = verifier.verify(new PageExtraction(PAGE_TEXT, null, true), null, null, null, List.of());

        assertThat(result.status()).isEqualTo(CertificationStatus.PASSED);
        assertThat(result.messages()).doesNotContain(CertificationVerifier.AI_SKIPPED_MESSAGE);
    }
}
