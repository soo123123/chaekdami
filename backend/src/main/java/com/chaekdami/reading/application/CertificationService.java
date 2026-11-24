package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.Certification;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ai.PageExtraction;
import com.chaekdami.reading.infrastructure.ai.PageTextExtractor;
import com.chaekdami.reading.presentation.dto.response.CertificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificationService {

    private final ReadingRecordRepository readingRecordRepository;
    private final CertificationRepository certificationRepository;
    private final PageTextExtractor pageTextExtractor;
    private final CertificationVerifier verifier;
    private final TransactionOperations transaction;

    // 독서 인증: 사진 → AI 글자 추출 → 검증 → 저장
    // startPage, endPage를 둘 다 보냈을 때만 사진의 쪽 번호가 그 범위(±3쪽) 안인지 확인
    // AI를 기다리는 동안 DB 연결을 쥐지 않도록 트랜잭션 밖에서 부르고, 저장할 때 기록을 다시 확인
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public CertificationResponse certify(Long userId, Long recordId, MultipartFile image,
                                         Integer startPage, Integer endPage, String sentence) {
        transaction.executeWithoutResult(status -> requireRecord(userId, recordId));

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("인증 사진을 올려주세요.");
        }
        byte[] bytes;
        try {
            bytes = image.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("사진을 읽지 못했습니다. 다시 올려주세요.");
        }

        // 업로드 도구마다 형식 정보(Content-Type)를 빠뜨리거나 octet-stream으로 보내는 경우가 있어서
        // 형식 정보 → 파일 내용(시그니처) → 확장자 순서로 확인
        String contentType = detectImageType(image.getContentType(), bytes, image.getOriginalFilename());
        if (contentType == null) {
            throw new IllegalArgumentException("이미지 파일만 올릴 수 있습니다.");
        }

        PageExtraction extraction = pageTextExtractor.extract(bytes, contentType);

        // 읽은 범위는 둘 다 보냈을 때만 비교 (안 보내면 쪽 번호 비교를 건너뜀 → 억울한 "확인 불가" 방지)
        Integer from = (startPage != null && endPage != null) ? startPage : null;
        Integer to = (startPage != null && endPage != null) ? endPage : null;
        return transaction.execute(status -> verifyAndSave(userId, recordId, extraction, from, to, sentence));
    }

    private CertificationResponse verifyAndSave(Long userId, Long recordId, PageExtraction extraction,
                                                Integer from, Integer to, String sentence) {
        ReadingRecord record = requireRecord(userId, recordId);
        List<String> previous = certificationRepository.findTop50ByUserIdOrderByIdDesc(userId).stream()
                .map(Certification::getNormalizedText)
                .toList();

        CertificationVerifier.Result result = verifier.verify(extraction, from, to, sentence, previous);

        Certification saved = certificationRepository.save(Certification.of(
                record,
                extraction.text(),
                result.normalizedText(),
                extraction.pageNumber(),
                extraction.isBookPage(),
                result.status(),
                String.join("\n", result.messages()),
                extraction.aiSkipped()
        ));
        return CertificationResponse.from(saved, result.sentenceFound());
    }

    private ReadingRecord requireRecord(Long userId, Long recordId) {
        return readingRecordRepository.findByIdAndUserId(recordId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "독서 기록을 찾을 수 없습니다: " + recordId));
    }

    // 사진 인증 추가 보상용: 이 세션에 보상 대상 인증(PASSED, AI 확인함)이 연결돼 있는가
    public boolean isPhotoCertified(Long userId, Long readingSessionId) {
        if (userId == null || readingSessionId == null) {
            return false;
        }
        return certificationRepository.findByUserIdAndReadingSessionId(userId, readingSessionId)
                .map(Certification::isRewardable)
                .orElse(false);
    }

    // 회차의 인증 목록
    public List<CertificationResponse> getCertifications(Long userId, Long recordId) {
        readingRecordRepository.findByIdAndUserId(recordId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "독서 기록을 찾을 수 없습니다: " + recordId));
        return certificationRepository.findAllByReadingRecordIdOrderByIdDesc(recordId).stream()
                .map(c -> CertificationResponse.from(c, null))
                .toList();
    }

    // 이미지면 형식(image/...)을, 아니면 null을 돌려줌
    private String detectImageType(String declared, byte[] b, String filename) {
        if (declared != null && declared.startsWith("image/")) {
            return declared;
        }
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "image/png";
        }
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F') {
            return "image/gif";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        if (b.length >= 12 && b[4] == 'f' && b[5] == 't' && b[6] == 'y' && b[7] == 'p') {
            String brand = new String(b, 8, 4, java.nio.charset.StandardCharsets.US_ASCII);
            if (brand.startsWith("hei") || brand.startsWith("hev") || brand.equals("mif1") || brand.equals("msf1")) {
                return "image/heic";   // 아이폰 기본 사진 형식
            }
        }
        if (filename != null) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
            if (lower.endsWith(".webp")) return "image/webp";
        }
        return null;
    }
}
