package com.chaekdami.dday.presentation;

import com.chaekdami.dday.application.DdayService;
import com.chaekdami.dday.presentation.dto.DdayResponse;
import com.chaekdami.dday.presentation.dto.DdaySaveRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dday")
@RequiredArgsConstructor
public class DdayController {

    private final DdayService ddayService;

    @GetMapping
    public DdayResponse get(@RequestHeader("X-User-Id") Long userId) {
        return ddayService.get(userId);
    }

    @PutMapping
    public DdayResponse save(@RequestHeader("X-User-Id") Long userId,
                             @RequestBody DdaySaveRequest request) {
        return ddayService.save(userId, request);
    }
}
