package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.domain.User;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class SuspendRequest {

    @Size(max = User.MAX_SUSPENSION_REASON_LENGTH, message = "정지 사유는 200자 이하여야 합니다.")
    private String reason;

    /** 정지 끝 시각. 비우면 무기한 */
    private LocalDateTime until;
}
