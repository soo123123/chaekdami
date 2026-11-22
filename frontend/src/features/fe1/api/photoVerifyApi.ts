import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import apiClient from '@/api/apiClient';
import { PHOTO_VERIFY_TIMEOUT_MS, PHOTO_VERIFY_USE_MOCK } from '../constants/config';

/**
 * 독서 인증 사진 검증 API (BE1 독서 인증).
 *
 *   POST /api/reading-records/{readingRecordId}/certifications   (multipart/form-data)
 *     image : 사진 파일 (JPEG)
 *     읽은 쪽 범위(startPage·endPage)와 문장은 보내지 않는다 (쪽 번호가 달라도 결과에 영향 없게, 스펙 004 R1.2)
 *   응답 201 : { id, readingRecordId, status: 'PASSED' | 'UNVERIFIED' | 'FAILED', messages: string[], ... }
 *
 * - 서버는 AI로 사진의 글자를 읽어 판정하고 이미지는 보관하지 않는다.
 * - PASSED만 통과로 본다. UNVERIFIED(글자를 충분히 못 읽음)도 FAILED처럼 다시 찍게 한다.
 * - 통과하면 id를 독서 세션 저장 요청(photoVerificationId)에 실어 보낸다. 서버는 그 세션에 인증을 연결해 사진 인증 보상을 판단한다.
 * - 계약이 바뀌면 이 파일의 상수와 toVerification만 고치면 된다.
 */
const certificationsPath = (readingRecordId: number) => `/api/reading-records/${readingRecordId}/certifications`;
const IMAGE_FIELD = 'image';
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
  /** readingRecordId: 인증할 회차 (책의 가장 최근 회차) */
  verify(readingRecordId: number, uri: string, signal?: AbortSignal): Promise<PhotoVerification>;
};

type BeCertificationStatus = 'PASSED' | 'UNVERIFIED' | 'FAILED';
type BeCertification = {
  id: number;
  readingRecordId: number;
  status: BeCertificationStatus;
  /** 판정 이유·안내 문구. PASSED여도 참고 문구(쪽 번호 못 찾음 등)가 올 수 있다 */
  messages?: string[] | null;
};

const toVerification = (data: BeCertification): PhotoVerification => {
  const verified = data.status === 'PASSED';
  // 통과면 참고 문구는 보여주지 않는다. 통과 못 했는데 문구가 없으면 화면이 기본 문구를 쓴다.
  const reason = verified ? undefined : (data.messages ?? []).filter(Boolean).join('\n') || undefined;
  return { verificationId: data.id, verified, reason };
};

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
  async verify(readingRecordId, uri, signal) {
    const form = new FormData();
    await appendPhoto(form, await shrinkPhoto(uri));
    const { data } = await apiClient.post<BeCertification>(certificationsPath(readingRecordId), form, {
      // 공용 기본값(application/json)을 덮어써야 FormData가 JSON으로 바뀌지 않는다. boundary는 axios/RN이 붙인다.
      headers: { 'Content-Type': 'multipart/form-data' },
      // AI 판정(서버가 한 번 다시 시도하면 약 40초)은 공용 apiClient 기본값(10초)보다 오래 걸릴 수 있다.
      // 화면(useReadingEnd)에서도 같은 시간으로 전체 검증을 끊으므로 값을 한 곳(config)에서 관리한다.
      timeout: PHOTO_VERIFY_TIMEOUT_MS,
      signal,
    });
    return toVerification(data);
  },
};

/**
 * 개발용 Mock. 화면 확인을 위해 결과를 바꿔가며 쓸 수 있다. 응답은 서버와 같은 모양으로 만들어 toVerification을 거친다.
 * - 'verified': 통과 / 'rejected': 책 페이지가 아님 / 'error': 서버 오류
 * - Mock 번호는 서버가 발급한 것이 아니다. 우연히 내 실제 인증 번호와 같으면 세션에 연결될 수 있으니 보상 확인에는 쓰지 않는다.
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
  async verify(readingRecordId, _uri, signal) {
    await waitOrAbort(MOCK_LATENCY_MS, signal);
    const outcome = MOCK_OUTCOME as 'verified' | 'rejected' | 'error';
    if (outcome === 'error') throw new MockHttpError(503, '사진 검증 서버에 연결하지 못했어요.');
    return toVerification(
      outcome === 'verified'
        ? { id: nextMockVerificationId++, readingRecordId, status: 'PASSED', messages: ['페이지 번호는 확인하지 못했어요.'] }
        : { id: nextMockVerificationId++, readingRecordId, status: 'FAILED', messages: ['책 페이지 사진이 아닌 것 같아요. 글자가 보이게 다시 찍어주세요.'] },
    );
  },
};

export const photoVerifyApi: PhotoVerifyApi = PHOTO_VERIFY_USE_MOCK ? devMockPhotoVerifyApi : httpPhotoVerifyApi;
