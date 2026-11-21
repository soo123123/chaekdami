import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import apiClient from '@/api/apiClient';
import { PHOTO_VERIFY_TIMEOUT_MS, PHOTO_VERIFY_USE_MOCK } from '../constants/config';

/**
 * 독서 인증 사진 검증 API.
 *
 * 백엔드 협의 초안 기준 계약:
 *   POST /api/reading-photos/verify   (multipart/form-data)
 *     image  : 사진 파일 (JPEG)
 *     bookId : 서재 책 번호
 *   응답 200 : { verificationId: number, verified: boolean, reason?: string }
 *
 * - 서버는 LLM으로 책 페이지 사진인지 판정만 하고 이미지는 보관하지 않는다.
 * - 통과하면 verificationId를 독서 세션 저장 요청(photoVerificationId)에 실어 보낸다.
 * - 계약이 바뀌면 이 파일의 상수와 toVerification만 고치면 된다.
 */
const VERIFY_PATH = '/api/reading-photos/verify';
const IMAGE_FIELD = 'image';
const BOOK_ID_FIELD = 'bookId';
const UPLOAD_FILE_NAME = 'reading-photo.jpg';

/** 업로드 전 긴 변을 이 크기(px) 이하로 줄인다. 업로드 시간과 LLM 비용을 줄이기 위함. */
const MAX_EDGE = 1280;
const JPEG_COMPRESS = 0.7;

export type PhotoVerification = {
  verificationId: number;
  verified: boolean;
  /** 통과하지 못한 이유 (서버가 주면 화면에 그대로 보여준다) */
  reason?: string;
};

export type PhotoVerifyApi = {
  verify(bookId: number, uri: string, signal?: AbortSignal): Promise<PhotoVerification>;
};

type BeVerifyResponse = { verificationId: number; verified: boolean; reason?: string | null };

const toVerification = (data: BeVerifyResponse): PhotoVerification => ({
  verificationId: data.verificationId,
  verified: data.verified,
  reason: data.reason ?? undefined,
});

/** 긴 변을 MAX_EDGE 이하로 줄이고 JPEG로 다시 저장한 사진의 URI를 돌려준다. */
async function shrinkPhoto(uri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = original;
  original.release();

  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_EDGE) {
    context.resize(width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  try {
    const saved = await image.saveAsync({ compress: JPEG_COMPRESS, format: SaveFormat.JPEG });
    return saved.uri;
  } finally {
    image.release();
    context.release();
  }
}

/** 플랫폼에 맞게 사진을 FormData 파일 파트로 붙인다. */
async function appendPhoto(form: FormData, uri: string) {
  if (Platform.OS === 'web') {
    // 웹: blob:/data: URL을 실제 Blob으로 바꿔서 넣는다.
    const blob = await (await fetch(uri)).blob();
    form.append(IMAGE_FIELD, blob, UPLOAD_FILE_NAME);
    return;
  }
  // iOS/Android: RN FormData는 { uri, name, type } 객체를 파일 파트로 보낸다.
  form.append(IMAGE_FIELD, { uri, name: UPLOAD_FILE_NAME, type: 'image/jpeg' } as unknown as Blob);
}

const httpPhotoVerifyApi: PhotoVerifyApi = {
  async verify(bookId, uri, signal) {
    const form = new FormData();
    await appendPhoto(form, await shrinkPhoto(uri));
    form.append(BOOK_ID_FIELD, String(bookId));
    const { data } = await apiClient.post<BeVerifyResponse>(VERIFY_PATH, form, {
      // 공용 기본값(application/json)을 덮어써야 FormData가 JSON으로 바뀌지 않는다. boundary는 axios/RN이 붙인다.
      headers: { 'Content-Type': 'multipart/form-data' },
      // LLM 판정은 공용 apiClient 기본값(10초)보다 오래 걸릴 수 있다.
      // 화면(useReadingEnd)에서도 같은 시간으로 전체 검증을 끊으므로 값을 한 곳(config)에서 관리한다.
      timeout: PHOTO_VERIFY_TIMEOUT_MS,
      signal,
    });
    return toVerification(data);
  },
};

/**
 * 개발용 Mock. 화면 확인을 위해 결과를 바꿔가며 쓸 수 있다.
 * - 'verified': 통과 / 'rejected': 책 페이지가 아님 / 'error': 서버 오류
 */
const MOCK_OUTCOME: 'verified' | 'rejected' | 'error' = 'verified';
const MOCK_LATENCY_MS = 1500;
let nextMockVerificationId = 1;

class MockHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const waitOrAbort = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('aborted'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('aborted'));
    }, { once: true });
  });

const devMockPhotoVerifyApi: PhotoVerifyApi = {
  async verify(_bookId, _uri, signal) {
    await waitOrAbort(MOCK_LATENCY_MS, signal);
    const outcome = MOCK_OUTCOME as 'verified' | 'rejected' | 'error';
    if (outcome === 'error') throw new MockHttpError(503, '사진 검증 서버에 연결하지 못했어요.');
    return outcome === 'verified'
      ? { verificationId: nextMockVerificationId++, verified: true }
      : { verificationId: nextMockVerificationId++, verified: false, reason: '책 페이지가 잘 보이지 않아요. 글자가 보이게 다시 찍어주세요.' };
  },
};

export const photoVerifyApi: PhotoVerifyApi = PHOTO_VERIFY_USE_MOCK ? devMockPhotoVerifyApi : httpPhotoVerifyApi;
