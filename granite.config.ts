// Apps-in-Toss 배포 시 사용되는 설정 파일
// 로컬 개발 시에는 Vite 단독으로 동작하며, 배포 시 granite CLI가 이 설정을 참조합니다.
export default {
  appName: 'saltify',
  brand: {
    displayName: '소금빵 크러쉬',
    primaryColor: '#D4A574',
    icon: '',
    bridgeColorMode: 'basic',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'game',
    overScrollMode: 'never',
  },
};
