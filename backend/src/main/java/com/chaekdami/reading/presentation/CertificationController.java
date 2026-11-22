package com.chaekdami.reading.presentation;

import com.chaekdami.reading.application.CertificationService;
import com.chaekdami.reading.presentation.dto.response.CertificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CertificationController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final CertificationService certificationService;

    // 독서 인증 — POST /api/reading-records/{id}/certifications (multipart/form-data)
    // image: 사진 파일(필수), startPage·endPage: 이번에 읽은 범위(선택, 둘 다 보내야 쪽 번호 비교), sentence: 인상 깊은 문장(선택)
    @PostMapping(value = "/reading-records/{id}/certifications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CertificationResponse certify(@RequestHeader(USER_ID_HEADER) Long userId,
                                         @PathVariable Long id,
                                         @RequestPart("image") MultipartFile image,
                                         @RequestParam(required = false) Integer startPage,
                                         @RequestParam(required = false) Integer endPage,
                                         @RequestParam(required = false) String sentence) {
        return certificationService.certify(userId, id, image, startPage, endPage, sentence);
    }

    // 회차의 인증 목록 — GET /api/reading-records/{id}/certifications
    @GetMapping("/reading-records/{id}/certifications")
    public List<CertificationResponse> getCertifications(@RequestHeader(USER_ID_HEADER) Long userId,
                                                         @PathVariable Long id) {
        return certificationService.getCertifications(userId, id);
    }
}
