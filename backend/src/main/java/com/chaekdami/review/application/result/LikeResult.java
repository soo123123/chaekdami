package com.chaekdami.review.application.result;

public record LikeResult(Long reviewId, boolean liked, int likeCount) {
}
