// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // 빌드 결과물과 자동 생성 파일
  globalIgnores([
    'dist/*',
    'web-build/*',
    '.expo/*',
    'ios/*',
    'android/*',
    'expo-env.d.ts',
  ]),
  expoConfig,
]);
