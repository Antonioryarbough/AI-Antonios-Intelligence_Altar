'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

function resolveFirebaseConfig() {
  // Prefer injected config from dev server or Firebase Hosting
  if (typeof window !== 'undefined' && window.__firebase_config) {
    return window.__firebase_config;
  }

  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Minimal validation so we fail fast if nothing is configured
  if (!cfg.projectId) {
    throw new Error(
      'Missing Firebase config. Provide NEXT_PUBLIC_FIREBASE_* env vars or window.__firebase_config.'
    );
  }

  return cfg;
}

export function getFirebaseApp() {
  const config = resolveFirebaseConfig();
  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}

export function getAppId() {
  if (typeof window !== 'undefined' && window.__app_id) return window.__app_id;
  return process.env.NEXT_PUBLIC_APP_ID || null;
}
