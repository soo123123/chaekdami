import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

type PickOptions = {
  /** 여러 장 선택 허용 (갤러리) */
  multiple?: boolean;
  /** 자르기 화면 비율. 지정하면 한 장만 선택한다. */
  aspect?: [number, number];
};

const QUALITY = 0.8;

/**
 * 카메라 촬영 / 갤러리 선택.
 * - 기기의 로컬 이미지 URI만 반환한다. 서버 업로드 방식은 백엔드 계약 확정 후 API 계층에서 처리한다.
 * - 권한이 거부되면 error에 안내 문구를 담고 빈 배열을 반환한다.
 * - 사용자가 취소해도 빈 배열을 반환한다.
 */
export function useImagePicker() {
  const [error, setError] = useState<string | null>(null);

  const takePhoto = useCallback(async ({ aspect }: PickOptions = {}): Promise<string[]> => {
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('카메라 권한이 필요해요. 설정에서 카메라 접근을 허용해주세요.');
        return [];
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: QUALITY,
        allowsEditing: !!aspect,
        aspect,
      });
      return result.canceled ? [] : result.assets.map(asset => asset.uri);
    } catch {
      setError('카메라를 열 수 없어요. 갤러리에서 선택해주세요.');
      return [];
    }
  }, []);

  const pickFromLibrary = useCallback(async ({ multiple = false, aspect }: PickOptions = {}): Promise<string[]> => {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('사진 접근 권한이 필요해요. 설정에서 사진 접근을 허용해주세요.');
        return [];
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: QUALITY,
        // 자르기와 여러 장 선택은 함께 쓸 수 없다.
        allowsMultipleSelection: multiple && !aspect,
        allowsEditing: !!aspect,
        aspect,
      });
      return result.canceled ? [] : result.assets.map(asset => asset.uri);
    } catch {
      setError('사진을 불러오지 못했어요. 다시 시도해주세요.');
      return [];
    }
  }, []);

  return { takePhoto, pickFromLibrary, error, clearError: () => setError(null) };
}
