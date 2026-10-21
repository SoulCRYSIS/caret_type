const env = import.meta.env

export const useEmulators = env.VITE_USE_EMULATORS === 'true'

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (useEmulators ? 'demo-api-key' : ''),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (useEmulators ? 'demo-caret.firebaseapp.com' : ''),
  projectId: env.VITE_FIREBASE_PROJECT_ID || (useEmulators ? 'demo-caret' : ''),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/** Without config the app runs fully offline as a guest. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
