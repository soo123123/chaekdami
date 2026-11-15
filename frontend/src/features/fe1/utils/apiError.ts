import { isAxiosError } from 'axios';

/**
 * 화면에서 사용하는 오류 형태.
 * - network: 서버에 도달하지 못함 (재시도 유도)
 * - client: 4xx (입력/상태 문제)
 * - server: 5xx
 * - pending: 백엔드 API 계약이 아직 확정되지 않음
 * - unknown: 그 외
 */
export type AppErrorKind = 'network' | 'client' | 'server' | 'pending' | 'unknown';

export type AppError = {
  kind: AppErrorKind;
  status?: number;
  code?: string;
  message: string;
};

/** 백엔드 계약 미확정 상태에서 호출되었음을 나타낸다. */
export class ContractPendingError extends Error {
  constructor(feature: string) {
    super(`${feature} API는 백엔드 계약이 확정되지 않아 아직 연결되지 않았어요.`);
    this.name = 'ContractPendingError';
  }
}

/** 서버 오류 응답 본문. be/feat/auth-user의 ApiErrorResponse(code, message, fields) 형태를 따른다. */
type ErrorBody = { code?: string; message?: string };

const STATUS_MESSAGES: Record<number, string> = {
  400: '입력한 내용을 다시 확인해주세요.',
  401: '로그인이 필요해요.',
  403: '접근 권한이 없어요.',
  404: '요청한 정보를 찾을 수 없어요.',
  409: '이미 서재에 등록된 책이에요.',
};

export function toAppError(error: unknown): AppError {
  if (error instanceof ContractPendingError) {
    return { kind: 'pending', message: error.message };
  }
  if (isAxiosError(error)) {
    if (!error.response) {
      return { kind: 'network', message: '네트워크 연결을 확인한 뒤 다시 시도해주세요.' };
    }
    const status = error.response.status;
    const body = (error.response.data ?? {}) as ErrorBody;
    const message = body.message || STATUS_MESSAGES[status] || '요청을 처리하지 못했어요.';
    return {
      kind: status >= 500 ? 'server' : 'client',
      status,
      code: body.code,
      message: status >= 500 ? '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.' : message,
    };
  }
  if (error instanceof Error && 'status' in error) {
    const status = Number((error as { status: unknown }).status);
    return {
      kind: status >= 500 ? 'server' : 'client',
      status,
      message: error.message || STATUS_MESSAGES[status] || '요청을 처리하지 못했어요.',
    };
  }
  return { kind: 'unknown', message: '알 수 없는 오류가 발생했어요.' };
}
