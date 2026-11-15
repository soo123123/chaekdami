import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

/** 기본 아이콘 색 (FE1 theme colors.text와 같은 값). 화면에서는 color를 직접 넘기는 것을 권장한다. */
const DEFAULT_ICON_COLOR = '#1B1B1B';

type IonName = ComponentProps<typeof Ionicons>['name'];
type McName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Glyph = { set: 'ion'; glyph: IonName } | { set: 'mc'; glyph: McName };

const ion = (glyph: IonName): Glyph => ({ set: 'ion', glyph });
const mc = (glyph: McName): Glyph => ({ set: 'mc', glyph });

/**
 * 앱 공용 아이콘 (FE1 + FE2). 아이콘을 의미 이름으로 모아두고, 교체할 때는 이 표만 바꾼다.
 * - 특수문자(◷, ✉, › 등)나 일부 이모지(🪙)는 기기 글꼴에 없으면 네모(□)로 나오므로 아이콘은 이 컴포넌트로 그린다.
 * - FE1·FE2 모두 쓰는 공용 파일이므로 이름을 바꾸거나 지울 때는 양쪽 사용처를 확인한다 (타입 검사에서 걸린다).
 * - FE1은 features/fe1/components/common/Icon.tsx를 통해 그대로 가져다 쓴다.
 */
const GLYPHS = {
  back: ion('chevron-back'),
  more: ion('ellipsis-horizontal'),
  search: ion('search-outline'),
  scan: mc('scan-helper'),
  heart: ion('heart'),
  heartOutline: ion('heart-outline'),
  clock: ion('time-outline'),
  calendar: ion('calendar-clear-outline'),
  calendarCheck: mc('calendar-check-outline'),
  calendarGoal: mc('calendar-month-outline'),
  book: ion('book-outline'),
  bookOpen: mc('book-open-variant'),
  bookOpenOutline: mc('book-open-outline'),
  trash: ion('trash-outline'),
  bookmark: ion('bookmark-outline'),
  chevronRight: ion('chevron-forward'),
  chevronDown: ion('chevron-down'),
  chevronUp: ion('chevron-up'),
  star: ion('star'),
  starOutline: ion('star-outline'),
  moreVertical: ion('ellipsis-vertical'),
  checkboxOn: ion('checkbox'),
  checkboxOff: ion('square-outline'),
  radioOn: ion('radio-button-on'),
  radioOff: ion('radio-button-off'),
  alert: ion('alert-circle-outline'),
  plus: ion('add'),
  close: ion('close'),
  globe: ion('globe-outline'),
  flag: mc('flag-variant'),
  camera: ion('camera'),
  gallery: ion('images-outline'),
  image: ion('image'),
  pencil: mc('pencil-outline'),
  publisher: mc('bank-outline'),
  barcode: mc('barcode'),
  alarm: mc('alarm'),
  stats: ion('stats-chart-outline'),
  pause: ion('pause'),
  play: ion('play'),
  focus: mc('white-balance-sunny'),
  eye: ion('eye-outline'),
  check: ion('checkmark'),
  leaf: mc('leaf'),
  save: mc('content-save'),
  bulb: ion('bulb-outline'),
  record: mc('book-clock-outline'),
  palette: ion('color-palette-outline'),
  // FE2에서 추가
  mail: ion('mail-outline'),
  person: ion('person-outline'),
  coin: mc('circle-multiple'),
  sparkles: ion('sparkles'),
  calendarOutline: ion('calendar-outline'),
} as const satisfies Record<string, Glyph>;

export type IconName = keyof typeof GLYPHS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 20, color = DEFAULT_ICON_COLOR, style }: IconProps) {
  const glyph: Glyph = GLYPHS[name];
  const common = { size, color, style, accessibilityElementsHidden: true, importantForAccessibility: 'no' as const };
  return glyph.set === 'ion'
    ? <Ionicons name={glyph.glyph} {...common} />
    : <MaterialCommunityIcons name={glyph.glyph} {...common} />;
}
