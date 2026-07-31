#!/usr/bin/env node
/** Vercel 빌드 시 환경 변수 → firebase-config.js 생성. 로컬은 firebase-config.js 직접 사용. */
import { writeFileSync } from 'node:fs';

/** @returns {Record<string, string> | null} */
function readConfig() {
  const raw = process.env.FIREBASE_CONFIG_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.apiKey && parsed?.projectId) return parsed;
    } catch (_) {}
  }
  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };
  if (cfg.apiKey && cfg.projectId && cfg.appId) {
    if (!cfg.measurementId) delete cfg.measurementId;
    return cfg;
  }
  return null;
}

const cfg = readConfig();
const out = cfg
  ? `window.FIREBASE_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`
  : 'window.FIREBASE_CONFIG = null;\n';

writeFileSync('firebase-config.js', out);
console.log(cfg ? '[firebase] firebase-config.js 생성됨' : '[firebase] env 없음 → telemetry 비활성');
