package com.chaekdami.reading.infrastructure.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Gemini로 책 페이지 사진에서 글자·페이지 번호를 추출 (reading.ocr.provider=gemini 일 때 사용)
// - AI 호출이 실패해도 인증 자체는 막지 않음: 빈 결과를 돌려주면 판정이 "확인 불가"가 됨
@Slf4j
@Component
@ConditionalOnProperty(name = "reading.ocr.provider", havingValue = "gemini")
public class GeminiPageTextExtractor implements PageTextExtractor {

    private static final String PROMPT = """
            이 사진은 독서 앱 사용자가 방금 읽은 책 페이지를 인증하려고 찍은 사진이다.
            아래 JSON 하나로만 답하라. 설명이나 코드 블록 없이 JSON만 출력한다.
            {"text": "...", "pageNumber": 47, "isBookPage": true}
            - text: 사진 속 본문 글자를 보이는 그대로 옮긴다. 최대 1500자. 글자가 없으면 빈 문자열.
            - pageNumber: 페이지에 인쇄된 쪽 번호(정수). 보이지 않거나 확실하지 않으면 null.
            - isBookPage: 종이책이나 전자책의 본문 페이지이면 true, 책이 아닌 사진(사람, 풍경, 영수증, 빈 화면 등)이면 false, 판단하기 어려우면 null.
            """;

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GeminiPageTextExtractor(@Value("${reading.ocr.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
                                   @Value("${reading.ocr.gemini.api-key:}") String apiKey,
                                   @Value("${reading.ocr.gemini.model:gemini-3.8-flash}") String model) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("reading.ocr.provider=gemini 인데 GEMINI_API_KEY 환경변수가 없습니다.");
        }
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(30));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("x-goog-api-key", apiKey)   // 키는 헤더로만 보냄 (URL에 넣지 않음)
                .build();
        this.apiKey = apiKey;
        this.model = model;
    }

    private static final int MAX_SIDE = 1600;   // 글자를 읽기에 충분한 크기 (긴 쪽 기준 px)

    @Override
    public PageExtraction extract(byte[] original, String originalType) {
        // 휴대폰 원본 사진(수 MB)을 그대로 보내면 느려서, 보내기 전에 줄임 (못 줄이면 원본 그대로)
        Shrunk shrunk = shrink(original, originalType);
        byte[] image = shrunk.bytes();
        String contentType = shrunk.contentType();
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(
                                Map.of("text", PROMPT),
                                Map.of("inlineData", Map.of(
                                        "mimeType", contentType,
                                        "data", Base64.getEncoder().encodeToString(image)))
                        )
                )),
                "generationConfig", Map.of("temperature", 0)
        );

        long started = System.currentTimeMillis();
        try {
            GeminiResponse response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(GeminiResponse.class);
            String answer = firstText(response);
            log.info("Gemini 추출 완료 ({}): {}ms, 답 {}자", model, System.currentTimeMillis() - started, answer.length());
            return parse(answer);
        } catch (Exception e) {
            // 한도 초과(429), 서버 오류, 시간 초과 등: 인증을 실패시키지 않고 "확인 불가"로 넘어가게 함
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            log.warn("Gemini 글자 추출 실패 ({}ms, 모델 {}): {} / 원인: {} {}", System.currentTimeMillis() - started, model,
                    e.getMessage(), root.getClass().getSimpleName(), root.getMessage());
            return new PageExtraction("", null, null);
        }
    }

    private record Shrunk(byte[] bytes, String contentType) {}

    // JPEG·PNG 등은 긴 쪽을 1600px로 줄이고 JPEG(품질 85%)로 다시 저장. HEIC처럼 읽을 수 없는 형식은 원본 그대로 보냄
    private Shrunk shrink(byte[] original, String contentType) {
        try {
            BufferedImage src = ImageIO.read(new ByteArrayInputStream(original));
            if (src == null) {
                return new Shrunk(original, contentType);
            }
            int w = src.getWidth();
            int h = src.getHeight();
            double scale = Math.min(1.0, (double) MAX_SIDE / Math.max(w, h));
            int nw = Math.max(1, (int) Math.round(w * scale));
            int nh = Math.max(1, (int) Math.round(h * scale));

            BufferedImage dst = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = dst.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, nw, nh);   // PNG 투명 배경은 흰색으로
            g.drawImage(src, 0, 0, nw, nh, null);
            g.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(0.85f);
            try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
                writer.setOutput(ios);
                writer.write(null, new IIOImage(dst, null, null), param);
            } finally {
                writer.dispose();
            }
            byte[] result = out.toByteArray();
            log.info("인증 사진 축소: {}x{} {}KB → {}x{} {}KB", w, h, original.length / 1024, nw, nh, result.length / 1024);
            return result.length < original.length ? new Shrunk(result, "image/jpeg") : new Shrunk(original, contentType);
        } catch (Exception e) {
            log.warn("인증 사진 축소 실패, 원본으로 보냄: {}", e.getMessage());
            return new Shrunk(original, contentType);
        }
    }

    private String firstText(GeminiResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            return "";
        }
        Content content = response.candidates().get(0).content();
        if (content == null || content.parts() == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (Part part : content.parts()) {
            if (part.text() != null) {
                sb.append(part.text());
            }
        }
        return sb.toString();
    }

    // AI 답에서 세 값을 꺼냄 (코드 블록이나 앞뒤 설명이 섞여 있어도 동작하도록 느슨하게)
    static PageExtraction parse(String answer) {
        if (answer == null || answer.isBlank()) {
            return new PageExtraction("", null, null);
        }
        String text = "";
        Matcher t = Pattern.compile("\"text\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"", Pattern.DOTALL).matcher(answer);
        if (t.find()) {
            text = unescape(t.group(1));
        }
        Integer page = null;
        Matcher p = Pattern.compile("\"pageNumber\"\\s*:\\s*\"?(-?\\d+)").matcher(answer);
        if (p.find()) {
            try {
                page = Integer.parseInt(p.group(1));
            } catch (NumberFormatException ignored) {
                page = null;
            }
        }
        Boolean bookPage = null;
        Matcher b = Pattern.compile("\"isBookPage\"\\s*:\\s*\"?(true|false)", Pattern.CASE_INSENSITIVE).matcher(answer);
        if (b.find()) {
            bookPage = Boolean.parseBoolean(b.group(1).toLowerCase());
        }
        return new PageExtraction(text, page, bookPage);
    }

    private static String unescape(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c != '\\' || i + 1 >= s.length()) {
                sb.append(c);
                continue;
            }
            char n = s.charAt(++i);
            switch (n) {
                case 'n' -> sb.append('\n');
                case 't' -> sb.append('\t');
                case 'r' -> sb.append('\r');
                case 'u' -> {
                    if (i + 4 < s.length()) {
                        sb.append((char) Integer.parseInt(s.substring(i + 1, i + 5), 16));
                        i += 4;
                    }
                }
                default -> sb.append(n);   // \" \\ \/
            }
        }
        return sb.toString();
    }

    // Gemini 응답에서 필요한 부분만 받음
    @JsonIgnoreProperties(ignoreUnknown = true)
    record GeminiResponse(List<Candidate> candidates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Candidate(Content content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Content(List<Part> parts) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Part(String text) {}
}
