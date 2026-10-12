/** 독서 기록 페이지 범위 검증. 오류 메시지 또는 null */
export function validatePageRange(startPage: number, endPage: number, totalPages?: number): string | null {
  if (startPage < 0 || endPage < 0) return '페이지는 0 이상이어야 해요.';
  if (endPage < startPage) return '종료 페이지는 시작 페이지보다 작을 수 없어요.';
  if (totalPages && endPage > totalPages) return `종료 페이지는 전체 페이지(${totalPages}쪽)를 넘을 수 없어요.`;
  return null;
}
