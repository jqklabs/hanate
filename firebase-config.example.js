/**
 * Firebase Analytics 연동 설정
 *
 * 1. Firebase Console → 프로젝트 → 웹 앱 추가 → firebaseConfig 복사
 * 2. Google Analytics(GA4) 연결 — measurementId 필수
 * 3. 이 파일을 firebase-config.js 로 복사 후 값 입력
 *
 * Vercel: Settings → Environment Variables → FIREBASE_CONFIG_JSON
 *   (firebaseConfig 객체를 JSON 한 줄로. 배포 시 scripts/generate-firebase-config.mjs 가 생성)
 *
 * Firebase Console → Authentication → Authorized domains:
 *   localhost, hwatro.jqklabs.com, *.vercel.app
 */
window.FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
  measurementId: 'G-XXXXXXXXXX', // Analytics 필수
};
