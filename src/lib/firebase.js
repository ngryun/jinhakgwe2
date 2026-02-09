import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { appConfig, isFirebaseConfigReady } from '../config/appConfig'

let app = null
let auth = null
let db = null
let googleProvider = null

if (appConfig.useFirebase && isFirebaseConfigReady()) {
  app = initializeApp(appConfig.firebase)
  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' })
}

export { app, auth, db, googleProvider }

export function isFirebaseEnabled() {
  return !!app && !!auth && !!db
}

export async function tryInitAnalytics() {
  if (!app || !appConfig.firebase.measurementId) {
    return null
  }

  const supported = await isAnalyticsSupported()
  if (!supported) {
    return null
  }

  return getAnalytics(app)
}
